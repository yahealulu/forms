"use client";

import { useState } from "react";

/**
 * useAdjustableState — keeps a local "draft" state in sync with an external
 * value, using the "adjusting state when a prop changes" pattern from the
 * React docs instead of `useEffect`. This avoids cascading renders and
 * satisfies the `react-hooks/set-state-in-effect` lint rule.
 *
 * The local state is reset whenever `external` changes (by reference for
 * objects/arrays, by value for primitives). Pass a primitive (string/number)
 * or a stable value (e.g. a memoized array) for best results.
 *
 * @see https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes
 */
export function useAdjustableState<T>(
  external: T
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [state, setState] = useState<T>(external);
  const [lastExternal, setLastExternal] = useState<T>(external);
  if (!Object.is(external, lastExternal)) {
    setLastExternal(external);
    setState(external);
  }
  return [state, setState];
}
