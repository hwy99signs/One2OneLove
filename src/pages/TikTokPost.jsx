import { useCallback, useEffect, useRef, useState } from 'react';
import PropTypes from 'prop-types';

// One2OneLove — TikTok posting (owner tool).
//
// This page implements TikTok's Content Sharing Guidelines UI requirements:
// - the connected account's nickname / avatar / username (from creator_info)
//   are clearly displayed before posting;
// - the privacy-level selector is populated from creator_info's
//   privacy_level_options and has NO pre-selected default;
// - Allow comment / duet / stitch toggles are OFF by default, and each is
//   disabled entirely when the creator has that interaction turned off;
// - the commercial-content disclosure toggle is OFF by default; when on, the
//   creator chooses "Your brand" or "Branded content", and branded content
//   cannot be posted with a private (Only me) privacy level;
// - the video is previewed and the title/caption is editable;
// - the TikTok Music Usage Confirmation line sits next to the Post button;
// - nothing is posted without an explicit click on Post (or Upload as draft).
//
// creator_info is re-queried immediately before every post, per TikTok's
// Direct Post guide. Video bytes travel through our own worker
// (/api/tiktok/post/chunk) so the TikTok upload URL never reaches the browser.

const PRIVACY_LABELS = {
  PUBLIC_TO_EVERYONE: 'Everyone',
  FOLLOWER_OF_CREATOR: 'Followers',
  MUTUAL_FOLLOW_FRIENDS: 'Friends',
  SELF_ONLY: 'Only me',
};

function api(path, options = {}) {
  return fetch(path, { credentials: 'include', ...options }).then(async (res) => {
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.ok === false) {
      throw new Error(data?.error?.message || `Request failed (HTTP ${res.status}).`);
    }
    return data;
  });
}

function Toggle({ label, description, checked, onChange, disabled }) {
  return (
    <label className={`flex items-start justify-between gap-4 rounded-xl border p-4 ${disabled ? 'opacity-50' : ''}`}>
      <span>
        <span className="block font-semibold text-gray-900">{label}</span>
        {description ? <span className="block text-sm text-gray-500">{description}</span> : null}
      </span>
      <input
        type="checkbox"
        className="mt-1 h-5 w-5 shrink-0 accent-pink-600"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
      />
    </label>
  );
}

Toggle.propTypes = {
  label: PropTypes.string.isRequired,
  description: PropTypes.string,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
};
Toggle.defaultProps = { description: undefined, disabled: false };

export default function TikTokPost() {
  const [status, setStatus] = useState(null); // { configured, environment, connected, creator }
  const [statusError, setStatusError] = useState('');
  const [creator, setCreator] = useState(null);
  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');
  const [durationSec, setDurationSec] = useState(null);
  const [title, setTitle] = useState('');
  const [privacy, setPrivacy] = useState(''); // intentionally no default selection
  const [allowComment, setAllowComment] = useState(false);
  const [allowDuet, setAllowDuet] = useState(false);
  const [allowStitch, setAllowStitch] = useState(false);
  const [disclose, setDisclose] = useState(false);
  const [brandKind, setBrandKind] = useState(''); // 'organic' (Your brand) | 'branded' (Branded content)
  const [busy, setBusy] = useState('');
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const videoRef = useRef(null);

  const loadStatus = useCallback(async () => {
    try {
      const data = await api('/api/tiktok/status');
      setStatus(data);
      if (data.creator) setCreator(data.creator);
      setStatusError('');
    } catch (err) {
      setStatus(null);
      setStatusError(err.message || 'TikTok status could not be loaded.');
    }
  }, []);

  useEffect(() => { loadStatus(); }, [loadStatus]);

  useEffect(() => () => { if (previewUrl) URL.revokeObjectURL(previewUrl); }, [previewUrl]);

  const refreshCreator = useCallback(async () => {
    const data = await api('/api/tiktok/creator-info', { method: 'POST' });
    setCreator(data.creator);
    return data.creator;
  }, []);

  useEffect(() => {
    if (status?.connected && !creator) {
      refreshCreator().catch((err) => setError(err.message));
    }
  }, [status, creator, refreshCreator]);

  const onPickFile = (event) => {
    const picked = event.target.files?.[0] || null;
    setResult(null);
    setError('');
    setDurationSec(null);
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(picked);
    setPreviewUrl(picked ? URL.createObjectURL(picked) : '');
  };

  const privacyOptions = Array.isArray(creator?.privacy_level_options) ? creator.privacy_level_options : [];
  const commentOff = creator?.comment_disabled === true;
  const duetOff = creator?.duet_disabled === true;
  const stitchOff = creator?.stitch_disabled === true;
  const maxDuration = Number(creator?.max_video_post_duration_sec) || null;
  const brandedPrivateConflict = disclose && brandKind === 'branded' && privacy === 'SELF_ONLY';
  const durationTooLong = maxDuration && durationSec && durationSec > maxDuration;

  const canPost = Boolean(
    file && creator && privacy && title.trim() && !busy && !brandedPrivateConflict && !durationTooLong
      && (!disclose || brandKind),
  );

  async function uploadAndPost(postMode) {
    setError('');
    setResult(null);
    setProgress(0);
    try {
      setBusy('Checking the connected TikTok account…');
      // Direct Post guide: creator_info must be queried before every post.
      const freshCreator = await refreshCreator();
      const freshOptions = Array.isArray(freshCreator?.privacy_level_options) ? freshCreator.privacy_level_options : [];
      if (postMode === 'DIRECT_POST' && freshOptions.length && !freshOptions.includes(privacy)) {
        throw new Error('The selected privacy level is no longer available for this account. Choose again.');
      }
      setBusy('Starting the TikTok upload…');
      const init = await api('/api/tiktok/post/init', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          post_mode: postMode,
          title: title.trim(),
          privacy_level: privacy,
          disable_comment: !allowComment,
          disable_duet: !allowDuet,
          disable_stitch: !allowStitch,
          brand_organic_toggle: disclose && brandKind === 'organic',
          brand_content_toggle: disclose && brandKind === 'branded',
          video_size: file.size,
          video_cover_timestamp_ms: 1000,
        }),
      });
      const chunkSize = init.chunk_size;
      const totalChunks = init.total_chunk_count;
      for (let index = 0; index < totalChunks; index += 1) {
        const start = index * chunkSize;
        const chunk = file.slice(start, Math.min(start + chunkSize, file.size));
        setBusy(`Uploading video… part ${index + 1} of ${totalChunks}`);
        const res = await fetch(
          `/api/tiktok/post/chunk?publish_id=${encodeURIComponent(init.publish_id)}&index=${index}`,
          { method: 'PUT', credentials: 'include', headers: { 'content-type': 'application/octet-stream' }, body: chunk },
        );
        const data = await res.json().catch(() => null);
        if (!res.ok || data?.ok === false) {
          throw new Error(data?.error?.message || `Upload failed on part ${index + 1}.`);
        }
        setProgress(Math.round(((index + 1) / totalChunks) * 100));
      }
      setBusy(postMode === 'DIRECT_POST' ? 'Posted — confirming with TikTok…' : 'Sent — confirming with TikTok…');
      let lastStatus = null;
      for (let attempt = 0; attempt < 40; attempt += 1) {
        const data = await api('/api/tiktok/post/status', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ publish_id: init.publish_id }),
        });
        lastStatus = data;
        if (data.status === 'PUBLISH_COMPLETE' || data.status === 'SEND_TO_USER_INBOX') break;
        if (data.status && data.status.includes('FAIL')) {
          throw new Error(`TikTok could not complete this post${data.fail_reason ? `: ${data.fail_reason}` : '.'}`);
        }
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
      setResult({
        mode: postMode,
        status: lastStatus?.status || 'UNKNOWN',
        postIds: lastStatus?.publicaly_available_post_id || [],
      });
    } catch (err) {
      setError(err.message || 'Posting failed.');
    } finally {
      setBusy('');
    }
  }

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <h1 className="text-3xl font-black text-gray-900">Post to TikTok</h1>
      <p className="mt-2 text-gray-600">
        Publish One2OneLove&apos;s approved reels to the One2OneLove TikTok account. Nothing is
        posted until you press Post.
      </p>
      {status?.environment ? (
        <p className="mt-3 inline-block rounded-full bg-gray-100 px-3 py-1 text-xs font-bold uppercase tracking-wide text-gray-600">
          TikTok environment: {status.environment}
        </p>
      ) : null}

      {statusError ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">TikTok posting isn&apos;t available right now.</p>
          <p className="mt-1 text-sm">{statusError}</p>
          <p className="mt-1 text-sm">
            If you are not signed in to One2OneLove, sign in first. If TikTok has not been
            configured on this deployment yet, the connection controls stay hidden until it is.
          </p>
        </div>
      ) : null}

      {status && !status.configured ? (
        <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
          <p className="font-bold">TikTok is not configured on this deployment yet.</p>
          <p className="mt-1 text-sm">
            The TikTok client key and secret have not been added to this environment, so no
            account can be connected and nothing can be posted. Once they are added, this page
            will offer the Connect button automatically.
          </p>
        </div>
      ) : null}

      {status?.configured && !status.connected ? (
        <div className="mt-6 rounded-xl border p-5">
          <p className="font-bold text-gray-900">Connect the One2OneLove TikTok account</p>
          <p className="mt-1 text-sm text-gray-600">
            You&apos;ll be sent to TikTok to authorize One2OneLove, then returned here.
          </p>
          <a
            href="/api/tiktok/connect"
            className="mt-4 inline-block rounded-full bg-black px-6 py-3 font-bold text-white"
          >
            Connect TikTok account
          </a>
          {status.reconnectRequired ? (
            <p className="mt-3 text-sm text-amber-700">
              A previous connection has expired — connecting again will restore posting.
            </p>
          ) : null}
        </div>
      ) : null}

      {status?.connected ? (
        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4 rounded-xl border p-4">
            {creator?.creator_avatar_url ? (
              <img src={creator.creator_avatar_url} alt="TikTok account avatar" className="h-14 w-14 rounded-full" />
            ) : (
              <div className="h-14 w-14 rounded-full bg-gray-200" />
            )}
            <div>
              <p className="text-lg font-black text-gray-900">{creator?.creator_nickname || 'Connected TikTok account'}</p>
              <p className="text-sm text-gray-500">{creator?.creator_username ? `@${creator.creator_username}` : 'Loading account…'}</p>
            </div>
            <button
              type="button"
              className="ml-auto text-sm font-semibold text-gray-500 underline"
              onClick={async () => {
                await api('/api/tiktok/disconnect', { method: 'POST' }).catch(() => {});
                setCreator(null);
                loadStatus();
              }}
            >
              Disconnect
            </button>
          </div>

          <div className="rounded-xl border p-5">
            <label className="block font-bold text-gray-900" htmlFor="tiktok-video">Video</label>
            <input id="tiktok-video" type="file" accept="video/*" className="mt-2 block w-full" onChange={onPickFile} />
            {file ? (
              <p className="mt-2 text-sm text-gray-500">
                {file.name} — {(file.size / (1024 * 1024)).toFixed(1)} MB
                {durationSec ? ` — ${Math.round(durationSec)}s` : ''}
                {maxDuration ? ` (this account allows up to ${maxDuration}s)` : ''}
              </p>
            ) : null}
            {durationTooLong ? (
              <p className="mt-2 text-sm font-semibold text-red-600">
                This video is longer than the connected account&apos;s maximum post duration.
              </p>
            ) : null}
            {previewUrl ? (
              <video
                ref={videoRef}
                src={previewUrl}
                controls
                className="mt-4 max-h-[480px] w-full rounded-xl bg-black"
                onLoadedMetadata={(e) => setDurationSec(e.currentTarget.duration || null)}
              />
            ) : null}
          </div>

          <div className="rounded-xl border p-5">
            <label className="block font-bold text-gray-900" htmlFor="tiktok-title">Title / caption</label>
            <textarea
              id="tiktok-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={2200}
              rows={3}
              className="mt-2 w-full rounded-xl border p-3"
              placeholder="Write the caption exactly as it should appear on TikTok…"
            />
            <p className="mt-1 text-right text-xs text-gray-400">{title.length} / 2200</p>
          </div>

          <div className="rounded-xl border p-5">
            <label className="block font-bold text-gray-900" htmlFor="tiktok-privacy">Who can view this post</label>
            <select
              id="tiktok-privacy"
              value={privacy}
              onChange={(e) => setPrivacy(e.target.value)}
              className="mt-2 w-full rounded-xl border p-3"
            >
              <option value="">Select who can view this post…</option>
              {privacyOptions.map((option) => (
                <option key={option} value={option}>{PRIVACY_LABELS[option] || option}</option>
              ))}
            </select>
            {!privacy ? (
              <p className="mt-2 text-sm text-gray-500">Choose an audience before posting — there is no default.</p>
            ) : null}
          </div>

          <div className="space-y-3">
            <Toggle
              label="Allow comments"
              description={commentOff ? 'The connected account has comments turned off.' : undefined}
              checked={allowComment}
              onChange={setAllowComment}
              disabled={commentOff}
            />
            <Toggle
              label="Allow duet"
              description={duetOff ? 'The connected account has duets turned off.' : undefined}
              checked={allowDuet}
              onChange={setAllowDuet}
              disabled={duetOff}
            />
            <Toggle
              label="Allow stitch"
              description={stitchOff ? 'The connected account has stitch turned off.' : undefined}
              checked={allowStitch}
              onChange={setAllowStitch}
              disabled={stitchOff}
            />
          </div>

          <div className="rounded-xl border p-5">
            <Toggle
              label="Disclose commercial content"
              description="Turn this on if this post promotes a brand, product, or service."
              checked={disclose}
              onChange={(value) => { setDisclose(value); if (!value) setBrandKind(''); }}
            />
            {disclose ? (
              <div className="mt-4 space-y-2">
                <label className="flex items-center gap-3">
                  <input type="radio" name="brand-kind" checked={brandKind === 'organic'} onChange={() => setBrandKind('organic')} />
                  <span><strong>Your brand</strong> — this post promotes One2OneLove itself.</span>
                </label>
                <label className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="brand-kind"
                    checked={brandKind === 'branded'}
                    onChange={() => setBrandKind('branded')}
                    disabled={privacy === 'SELF_ONLY'}
                  />
                  <span><strong>Branded content</strong> — this post promotes another brand for payment or an incentive.</span>
                </label>
                {privacy === 'SELF_ONLY' ? (
                  <p className="text-sm text-amber-700">Branded content cannot be private, so it is unavailable with the Only me audience.</p>
                ) : null}
                {brandedPrivateConflict ? (
                  <p className="text-sm font-semibold text-red-600">Branded content cannot be posted as Only me — pick a different audience.</p>
                ) : null}
              </div>
            ) : null}
          </div>

          {error ? <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">{error}</div> : null}
          {result ? (
            <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-green-900">
              {result.mode === 'DIRECT_POST'
                ? `TikTok reports: ${result.status}${result.postIds?.length ? ` — post id ${result.postIds.join(', ')}` : ''}. Check the TikTok profile to see the finished post.`
                : `TikTok reports: ${result.status}. The video is in the TikTok inbox as a draft for the account owner to finish and post.`}
            </div>
          ) : null}

          <div className="rounded-xl border p-5">
            <p className="text-sm text-gray-600">
              By continuing, you agree to TikTok&apos;s <strong>Music Usage Confirmation</strong> and
              confirm you have the rights to post this video.
            </p>
            {busy ? <p className="mt-3 font-semibold text-gray-800">{busy}{progress ? ` — ${progress}%` : ''}</p> : null}
            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                disabled={!canPost}
                onClick={() => uploadAndPost('DIRECT_POST')}
                className="rounded-full bg-black px-8 py-3 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40"
              >
                Post to TikTok
              </button>
              <button
                type="button"
                disabled={Boolean(!file || !creator || busy)}
                onClick={() => uploadAndPost('MEDIA_UPLOAD')}
                className="rounded-full border px-8 py-3 font-bold text-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Upload as draft instead
              </button>
            </div>
            <p className="mt-3 text-xs text-gray-400">
              Post publishes directly to the connected account. Upload as draft sends the video to
              the account&apos;s TikTok inbox instead, where it can be finished in the TikTok app.
            </p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
