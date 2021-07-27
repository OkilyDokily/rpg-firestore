import{ useEffect, useRef } from 'react';

function useInterval(callback, delay) {
  const savedCallback = useRef();
  const interval = useRef(0);
  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export default useInterval;
//source for this custom hook is https://overreacted.io/making-setinterval-declarative-with-react-hooks/ 