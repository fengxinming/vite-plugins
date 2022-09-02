import create from 'zustand';

function fetchCount(amount = 1) {
  return new Promise((resolve) => {
    setTimeout(() => resolve({ data: amount }), 500);
  });
}

export default create((setState, getState) => ({
  value: 0,
  status: 'idle',
  incrementAmount: 2,

  increment() {
    setState((state) => ({ value: state.value + 1 }));
  },

  decrement() {
    setState((state) => ({ value: state.value - 1 }));
  },

  incrementByAmount() {
    setState((state) => ({ value: state.value + state.incrementAmount }));
  },

  async incrementAsync() {
    setState({ status: 'loading' });

    let { incrementAmount } = getState();
    incrementAmount = (await fetchCount(incrementAmount)).data;

    setState((state) => ({ status: 'idle', value: state.value + incrementAmount }));
  },

  incrementIfOdd() {
    setState((state) => {
      const { value } = state;
      if (value % 2 === 1) {
        return { value: state.value + state.incrementAmount };
      }
      return state;
    });
  },

  setIncrementAmount(e) {
    setState({ incrementAmount: Number(e.target.value) || 0 });
  }
}));
