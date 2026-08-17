/**
 * dsh-peak-status — host half.
 *
 * No host behavior: the browser half renders the peak indicator chip.
 * Kept as a real (no-op) plugin so the loader entry mounts — the
 * client-modules scan only admits entries whose host fiber is active.
 */

export const apply = function () {
  // Intentionally empty.
}
