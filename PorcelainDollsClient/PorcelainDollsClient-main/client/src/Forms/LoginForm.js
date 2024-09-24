// Forms/LoginForm.js
import React from 'react';

function LoginForm({ username, setUsername, password, setPassword, handleLogin }) {
  return (
    <div className="form-group">
      <input
        type="text"
        className="input-field"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        placeholder="Username"
      />
      <input
        type="password"
        className="input-field"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Password"
      />
      <button className="btn btn-secondary" onClick={handleLogin}>Login</button>
    </div>
  );
}

export default LoginForm;
