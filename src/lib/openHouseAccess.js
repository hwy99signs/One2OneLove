export function adminAccessActive(user) {
  if (!user?.subscription_end_date) return false;
  const end = new Date(user.subscription_end_date);
  return Boolean(!Number.isNaN(end.getTime()) && end.getTime() > Date.now());
}

export function hasFullMemberAccess(user) {
  if (!user) return false;
  if (String(user.role || '').toLowerCase() === 'admin') return true;
  const status = String(user.subscription_status || '').toLowerCase();
  const paidOrGranted = Boolean(user.stripe_subscription_id) || adminAccessActive(user);
  return ['active','trial','trialing'].includes(status) && paidOrGranted;
}

export function openHouseProtectedDestination(user, feature='feature') {
  const encoded = encodeURIComponent(feature);
  return user?.id
    ? `/Subscription?open-house=${encoded}&membership=required`
    : `/SignUp?source=open-house&feature=${encoded}`;
}
