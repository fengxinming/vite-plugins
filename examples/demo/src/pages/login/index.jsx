import styles from './index.module.scss';
import React, { useState, useCallback } from 'react';
import { Input, Form, Message } from '@alicloud/console-components';
import { history } from '@/config/routes';
import { stashToken } from '@/common/user';
import bg from './login-bg.jpg';

const FormItem = Form.Item;

function useMain() {
  const [state, setState] = useState({
    loading: false,
    errorMessage: '',
    value: {
      username: 'admin',
      password: ''
    }
  });

  const formChange = useCallback((formValue) => {
    setState((prev) => {
      return {
        ...prev,
        value: { ...prev.value, ...formValue }
      };
    });
  }, [setState]);

  const handleSubmit = useCallback((values, errors) => {
    if (errors) {
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    setTimeout(() => {
      setState((prev) => ({ ...prev, loading: false }));
      stashToken(123456);
      history.push('/guide');
    }, 200);
  }, [setState]);

  return {
    state,
    formChange,
    handleSubmit
  };
}

function LoginForm() {
  const { state, formChange, handleSubmit } = useMain();
  const { value, errorMessage, loading } = state;

  return (
    <h2 className={styles['login-frame']}>
      <div className={styles['login-box']}>
        <h3>管理员登录</h3>
        <div x-class={[styles['login-error'], { [styles.blank]: !errorMessage }]}>
          <Message x-if={errorMessage} type="warning">{errorMessage}</Message>
        </div>
        <Form value={value} onChange={formChange}>
          <FormItem className={styles.formItem}>
            <Input
              size="large"
              name="password"
              htmlType="password"
              placeholder="请输入管理员的密码"
              className={styles['login-input']}
            />
          </FormItem>
          <FormItem>
            <Form.Submit
              validate
              type="primary"
              htmlType="submit"
              loading={loading}
              onClick={handleSubmit}
              className={styles['login-submit']}
            >
              {loading ? '登录中...' : '登录'}
            </Form.Submit>
          </FormItem>
        </Form>
      </div>
    </h2>
  );
}

export default function () {

  return (
    <div className={styles['login-layout']}>
      <div className={styles.header}>
        <span className={styles.logo}>LOGO</span>
      </div>
      <div className={styles.aside}>
        <h2>欢迎访问</h2>
        <p>本地控制台</p>
      </div>
      <div
        className={styles.content}
        style={{ backgroundImage: `url(${bg})` }}
      >
        <LoginForm />
      </div>
    </div>
  );
}
