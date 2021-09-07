export function isLogin() {
  return !!sessionStorage.getItem('token');
}

export function isActive() {
  return !!sessionStorage.getItem('active');
}

export function stashActiveFlag(flag) {
  sessionStorage.setItem('active', flag);
}

export function stashToken(token) {
  sessionStorage.setItem('token', token);
}
