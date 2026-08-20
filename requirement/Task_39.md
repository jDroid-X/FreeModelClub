# Task List: Agent Loop Auto-Failover

- [x] Inspect how `ComboModel` is initialized in `executeLoop`.
- [x] Implement the `attemptCount < maxAttempts` failover loop around `_callModel`.
- [x] Add the provider/model switching logic and `AUTO_FAILOVER` logging.
- [x] Update `walkthrough.md` when completed.