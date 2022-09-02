import React from 'react';
import { Button } from '@alicloud/console-components';
import useCounter from '@/store/counter';
import styles from './index.module.css';

function Counter() {
  const {
    value,
    incrementAmount,

    decrement,
    increment,
    setIncrementAmount,
    incrementByAmount,
    incrementAsync,
    incrementIfOdd
  } = useCounter();

  return (
    <div>
      <div className={styles.row}>
        <Button
          onClick={decrement}
        >
          -
        </Button>
        <span className={styles.value}>{value}</span>
        <Button
          onClick={increment}
        >
          +
        </Button>
      </div>
      <div className={styles.row}>
        <input
          className={styles.textbox}
          value={incrementAmount}
          onChange={setIncrementAmount}
        />
        <Button
          onClick={incrementByAmount}
        >
          Add Amount
        </Button>
        <Button
          onClick={incrementAsync}
        >
          Add Async
        </Button>
        <Button
          onClick={incrementIfOdd}
        >
          Add If Odd
        </Button>
      </div>
    </div>
  );
}

export default Counter;
