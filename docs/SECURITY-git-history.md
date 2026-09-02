# 🔴 Public git history exposes live credentials

**Found:** 2026-09-03, during the SEO fix pass.
**Repo:** `DiggieBambot/Francolink-App` — **public**.

## What is exposed

Commit `0e94de8` ("security: remove committed secrets from the repo") untracked
the offending files. **Untracking does not remove them from history.** Every
value below is still retrievable with a single `git show`, and the pre-cleanup
commits are ancestors of `origin/main` — so they are published on GitHub.

| Secret | File (at `0e94de8^`) | Impact |
|---|---|---|
| Stripe `sk_live_*` | `ecosystem.config.js` | live payment API access |
| Supabase service-role key | `ecosystem.config.js`, `scripts/run-batch-hydrate.sh`, `scripts/generate-english-lessons.ts` | **bypasses RLS — full read/write on the entire database** |
| SSH private key (`diggiebambot@github`) | committed as `Documents` | |
| SSH private key (`precious.bambot@gmail.com`) | `ssh-keygen -t ed25519 -C "..."` | |

Neither SSH key matches the current `~/.ssh/id_ed25519`.

The cleanup commit's own message names each file and the credential it held —
an attacker reading the history does not have to search for any of it.

## Do this in order

**1. Rotate. This matters more than cleaning history** — a rewrite cannot
un-leak anything already cloned, forked or cached, and GitHub keeps unreferenced
commits reachable for a period.

- [ ] Stripe → roll the live secret key
- [ ] Supabase → rotate the service-role key (Settings → API), then update it in
      Vercel env, `.env.local`, and the server's `ecosystem.config.js`
- [ ] GitHub → delete both SSH keys from the account, and remove them from any
      server's `authorized_keys`
- [ ] Audit for misuse while the keys were live: Stripe dashboard for unexpected
      charges/refunds, Supabase logs for unfamiliar service-role access

**2. Then decide on the history** (needs an explicit call — both are disruptive):

- Rewrite with `git filter-repo` or BFG plus a force-push. Breaks every existing
  clone and rewrites all seven remote branches. Anyone else working on the repo
  must re-clone.
- Or make the repository private, which stops new exposure but does not undo
  what has already been public.

**3. Prevent recurrence**

- [ ] Enable GitHub secret scanning + push protection on the repo
- [ ] Consider a pre-commit secret scan (gitleaks) so this cannot recur

## Note

`.gitignore` already listed `ssh-keygen*` before the original leak. Gitignore
does not apply to files that are already tracked, which is exactly how these
stayed exposed — and why rotation, not gitignore, is the fix.
