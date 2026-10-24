/**
 * The `banReason` staff-app gives the linked user when a member is marked inactive
 * (inactive-members rule 9). Reactivating unbans only a ban whose reason is exactly this string
 * (rule 10), so it's compared, stored in auth-server, and never translated.
 */
export const MEMBER_INACTIVE_BAN_REASON = "Member marked inactive";
