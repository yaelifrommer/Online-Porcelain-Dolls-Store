
// Forms/RegisterForm.js
import React from 'react';

function RegisterForm({ username, setUsername, password, setPassword, handleRegister }) {
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
      <button className="btn btn-primary" onClick={handleRegister}>Register</button>
    </div>
  );
}

export default RegisterForm;
