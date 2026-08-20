# One2OneLove SMS Messaging Legal / Compliance Draft

**Status:** DEVELOPMENT DRAFT — NOT FINAL LEGAL TERMS

**Approval context:** Approval #9B authorizes development of the recipient-controlled SMS consent and legal-disclosure foundation. It does **not** authorize publishing this draft as final legal policy, Twilio/A2P registration, paid provider activation, production consent capture, or SMS sending.

This document is an implementation checklist and draft source for final legal review. It is not legal advice and must be reviewed against the actual launch markets, provider configuration, support contact, and operating practices before production publication.

## 1. Program scope currently designed

Program name: **One2OneLove Love Notes SMS**

Current intended scope: transactional Love Note invitation messages and SMS messages required to operate that specific messaging service. The current consent design does **not** authorize general marketing or promotional SMS.

SMS is optional. A person must be able to use One2OneLove and receive Love Note invitations by available non-SMS methods without providing SMS consent.

## 2. Same-screen opt-in disclosures

The recipient-controlled web form must keep these concepts adjacent to the unchecked SMS consent control:

- The person confirms that the mobile number belongs to / is controlled by them.
- The person voluntarily agrees to receive transactional One2OneLove Love Note invitation and required service SMS at that number.
- Message frequency varies.
- Message and data rates may apply.
- Reply **STOP** to cancel.
- Reply **HELP** for help.
- Consent is not required to use One2OneLove.
- Email Love Note delivery remains available where enabled.
- The consent does not include marketing or promotional SMS.
- Terms of Service and Privacy Policy links are visible next to the opt-in disclosure.

The SMS checkbox must be unchecked by default and must never be bundled into mandatory account creation, membership purchase, Terms acceptance, or another required agreement.

## 3. Draft Terms concepts for final counsel review

The final Terms should accurately state, at minimum:

1. Program name and description.
2. That SMS participation is optional.
3. The types of messages a participant can expect.
4. That message frequency varies based on Love Note activity and service events.
5. That message and data rates may apply.
6. STOP instructions and the effect of opting out.
7. HELP instructions and the final approved support method.
8. Link/reference to the final Privacy Policy.
9. Carrier/network delivery limitations or delayed/undelivered-message disclaimer appropriate to the selected provider.
10. Any geographic eligibility, age, account, abuse-prevention, or recipient-verification conditions actually used at launch.

Do not publish a support email, phone number, mailing address, carrier list, or provider promise until the real operating detail is confirmed.

## 4. Draft Privacy concepts for final counsel review

The final Privacy Policy should accurately explain:

- A mobile number is used to provide the SMS feature requested by the recipient.
- One2OneLove stores server-side consent evidence sufficient to demonstrate the opt-in and opt-out state.
- The staged design minimizes consent evidence by storing a server-peppered hash rather than a second raw or partial copy of the phone number in the consent table.
- Consent evidence records the program/disclosure/Terms/Privacy versions accepted and timestamps needed to administer the service.
- Mobile information and SMS opt-in consent will not be sold or shared with third parties/affiliates for their marketing or promotional purposes.
- Necessary service providers/aggregators may process data only as required to provide the messaging service, subject to the final provider agreement and final legal review.
- A recipient can withdraw SMS consent, including by supported STOP keywords, without losing access to the core One2OneLove service.
- Retention/deletion language must match the final production retention policy and applicable law; do not invent a retention period before that policy is approved.

## 5. Consent evidence design

Development schema: `public.love_note_sms_consents`

The current staged record contains:

- server-peppered phone hash;
- active/revoked state;
- web-form or inbound-keyword method;
- recipient-facing language;
- program version;
- disclosure version;
- Terms version;
- Privacy version;
- opaque consent event reference;
- consent/revocation and record timestamps.

It intentionally does **not** store a raw/partial phone number or IP address in the consent evidence table, and browser roles receive no table access.

## 6. Opt-out handling

Before production SMS activation:

- The Twilio Messaging Service must be configured so required STOP/START/HELP handling is consistent with the final program and supported launch languages.
- One2OneLove must reconcile provider opt-outs into its server-side consent state.
- Scheduled Love Notes must re-check consent immediately before provider submission.
- A revoked or opted-out destination must not receive a scheduled SMS merely because it was consented when the Love Note was scheduled.

## 7. Five-language requirement

Every recipient-facing SMS consent, disclosure, status, HELP/STOP guidance, invitation, and related legal-link label introduced by this feature must be available through the existing One2OneLove five-language framework:

- English (`en`)
- Spanish (`es`)
- French (`fr`)
- Italian (`it`)
- German (`de`)

The English legal source may be reviewed first, but production publication must not silently hard-code English for the other active languages. Any final legal translation process should preserve the meaning of the counsel-approved source rather than treating machine-translated legal prose as independently approved legal text.

## 8. Production blockers that remain

SMS must remain OFF until separately approved and verified:

- final legal wording / launch-market review;
- final support contact/method;
- Twilio account and Messaging Service;
- A2P 10DLC registration for applicable U.S. traffic;
- provider credentials stored server-side only;
- production application of the consent schema;
- deployment of the recipient consent endpoint;
- provider opt-out synchronization;
- controlled consent test;
- controlled SMS send test;
- cost authorization and live SMS enable switches.

These blockers belong in the next approval batch rather than interrupting ongoing development.
