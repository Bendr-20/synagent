# Cred Bureau Rewards Weekly Operations

## Weekly Checkpoint Process

### Monday UTC – Checkpoint Start
1. **Open the review queue** (`/review/cred-bureau/rewards`)
2. **Filter contributions** from the previous week (Monday-Sunday UTC)
3. **Begin batch review** using the rubric in `docs/cred-bureau-rewards-review-rubric.md`

### Review Steps for Each Contribution
1. **Verify evidence** – URLs accessible, screenshots clear
2. **Check for duplicates** – same work submitted multiple times
3. **Apply category rubric** – assign points within allowed ranges
4. **Score social evidence** – if applicable, apply caps and multipliers
5. **Complete anti-farm checklist** – mark payout-eligible true/false
6. **Add reviewer notes** – document any conflicts or special considerations

### Tuesday-Wednesday – Review Completion
1. **Complete all pending reviews** from the checkpoint week
2. **Calculate preliminary scores** – sum points for each participant
3. **Update leaderboard** – system auto-updates after reviews
4. **Prepare weekly recap** – use template below

### Thursday – Communication
1. **Post weekly recap** to X using the template
2. **Monitor for corrections** – participants may provide additional evidence
3. **Update reviews if needed** – make adjustments based on new information

## Weekly Recap Template

Already anchored in `docs/cred-bureau-review-ops.md` as `## Weekly recap template`.

**Usage:**
```text
Cred Bureau weekly checkpoint — Week [N] / Season [1|2]

Reviewed this week:
- Approved contributions: [count]
- Points awarded after manual review: [points]
- Top contribution categories: [categories]
- Open queue: [submitted count] submitted, [needs-info count] needs-info

Current public leaderboard snapshot:
1. [display name] — [points] pts
2. [display name] — [points] pts
3. [display name] — [points] pts

Reviewer note:
- Contributions remain subject to manual review and anti-farm checks before rewards are sent.
- Next checkpoint: [date/time UTC]
```

**Rules:**
- Keep public-safe: no wallets, reviewer keys, private notes, or payout promises
- Focus on transparency without exposing anti-farm mechanisms
- Include reminder that all rewards require manual review

## Final Winners Post Template

Already anchored in `docs/cred-bureau-review-ops.md` as `## Final winners post template`.

**Usage:**
```text
Cred Bureau Season [N] final standings

1. [display name] — [points] pts — [primary contribution type]
2. [display name] — [points] pts — [primary contribution type]
3. [display name] — [points] pts — [primary contribution type]

Season notes:
- Total reviewed contributors: [count]
- Total approved contributions: [count]
— Review window: [start date UTC] to [end date UTC]
- Manual anti-farm review completed: [yes/no + reviewer initials]

Rewards are handled manually by the team after final checks.
Questions or corrections: [contact/process]
```

**Rules:**
- Only post after season review closed, anti-farm review complete, payout export created
- No wallet addresses, payout amounts, or private reviewer notes
- Include disclaimer about manual reward handling

## Season-End Operations

### Week 3 of Each Season
1. **Final review pass** – re-check top 20 participants for anti-farm issues
2. **Generate payout export** – from protected review queue (`/review/cred-bureau/rewards`)
3. **Verify export completeness** – all payout-eligible participants included
4. **Manual payout execution** – by Cred Bureau team (offline process)
5. **Post final winners** – using template above

### Post-Season Documentation
1. **Archive review logs** – store for reference
2. **Update rules/rubric** – based on season learnings
3. **Prepare for next season** – reset leaderboard, update season counter

## Troubleshooting

### Common Issues & Solutions

**Issue:** Evidence URLs broken  
**Solution:** Mark as needs-info, request updated evidence via contact info

**Issue:** Suspected farming patterns  
**Solution:** Mark payout-eligible false, document in anti-farm notes

**Issue:** Social contributions exceeding caps  
**Solution:** Cap at 15% of season score, document adjustment

**Issue:** Reviewer conflict of interest  
**Solution:** Assign to backup reviewer, document conflict

### Emergency Procedures

**If review key compromised:**
1. Generate new key immediately
2. Update environment variables
3. Notify other reviewers
4. Log incident in review log

**If payout export contains errors:**
1. Stop payout process immediately
2. Regenerate export after corrections
3. Verify with second reviewer
4. Resume manual payout

## Review Team Coordination

### Primary Reviewer (Quigley)
. - Owns final approve/reject decisions
- Completes weekly checkpoints
-B- Posts weekly recaps
- Executes final season reviews

### Backup Reviewer (Jim)
- Covers when primary unavailable
- Handles technical/admin issues
-m- Assists with conflict cases
  
### Communication Protocol
- Weekly checkpoint status in team chat
- Any payout-eligible false decisions discussed
- Season-end coordination via direct chat