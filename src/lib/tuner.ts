export interface SpringState {
  value: number;
  velocity: number;
}

/**
 * One step of a critically damped spring towards `target` (exact solution, so any frame gap is stable).
 * The tuner reads pitch every frame; following it with a spring turns the jitter into a calm, readable needle.
 * `response` ≈ seconds to (almost) settle.
 */
export function springStep(state: SpringState, target: number, dtMs: number, response = 0.3): SpringState {
  const omega = (2 * Math.PI) / response;
  const t = Math.max(0, dtMs) / 1000;
  const c1 = state.value - target;
  const c2 = state.velocity + omega * c1;
  const decay = Math.exp(-omega * t);
  return {
    value: target + (c1 + c2 * t) * decay,
    velocity: (c2 - omega * (c1 + c2 * t)) * decay,
  };
}
