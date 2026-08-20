# Task List: Agent Loop Auto-Failover

- [/] Inspect how `ComboModel` is initialized in `executeLoop`.
- [ ] Implement the `attemptCount < maxAttempts` failover loop around `_callModel`.
- [ ] Add the provider/model switching logic and `AUTO_FAILOVER` logging.
- [ ] Update `walkthrough.md` when completed.