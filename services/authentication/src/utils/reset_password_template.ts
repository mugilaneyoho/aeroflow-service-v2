export function getResetPasswordHtml(token: string, apiEndpoint: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset Password - Aeroflow</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #8a2be2;
      --primary-hover: #7b1fa2;
      --bg-start: #0f0c1b;
      --bg-end: #201a30;
      --card-bg: rgba(255, 255, 255, 0.05);
      --card-border: rgba(255, 255, 255, 0.1);
      --text: #ffffff;
      --text-muted: #b0a8c0;
      --error: #ff4d4d;
      --success: #00e676;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, var(--bg-start) 0%, var(--bg-end) 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      overflow-x: hidden;
    }

    .container {
      width: 100%;
      max-width: 450px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
      animation: fadeIn 0.8s ease;
      position: relative;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .logo-container {
      text-align: center;
      margin-bottom: 30px;
    }

    .logo-container h1 {
      font-weight: 800;
      font-size: 2.2rem;
      background: linear-gradient(to right, #8a2be2, #df49ff);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 5px;
    }

    .logo-container p {
      color: var(--text-muted);
      font-size: 0.95rem;
      font-weight: 300;
    }

    .form-group {
      margin-bottom: 20px;
      position: relative;
    }

    .form-group label {
      display: block;
      margin-bottom: 8px;
      color: var(--text-muted);
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .form-group input {
      width: 100%;
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 10px;
      padding: 12px 15px;
      color: var(--text);
      font-family: inherit;
      font-size: 1rem;
      transition: all 0.3s ease;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--primary);
      background: rgba(255, 255, 255, 0.12);
      box-shadow: 0 0 10px rgba(138, 43, 226, 0.3);
    }

    .btn {
      width: 100%;
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-top: 10px;
    }

    .btn:hover {
      background: var(--primary-hover);
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
    }

    .btn:active {
      transform: translateY(0);
    }

    .btn:disabled {
      background: rgba(255, 255, 255, 0.15);
      color: rgba(255, 255, 255, 0.3);
      cursor: not-allowed;
      transform: none !important;
      box-shadow: none !important;
    }

    .error-msg {
      color: var(--error);
      font-size: 0.85rem;
      margin-top: 5px;
      display: none;
    }

    .success-container {
      display: none;
      text-align: center;
      animation: scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes scaleIn {
      from { transform: scale(0.8); opacity: 0; }
      to { transform: scale(1); opacity: 1; }
    }

    .success-icon {
      width: 80px;
      height: 80px;
      background: rgba(0, 230, 118, 0.1);
      border: 2px solid var(--success);
      color: var(--success);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin: 0 auto 20px;
      animation: pop 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275);
    }

    @keyframes pop {
      0% { transform: scale(0); }
      80% { transform: scale(1.1); }
      100% { transform: scale(1); }
    }

    .success-container h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    .success-container p {
      color: var(--text-muted);
      margin-bottom: 25px;
    }

    .form-wrapper {
      transition: all 0.3s ease;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="form-wrapper" id="formWrapper">
      <div class="logo-container">
        <h1>Aeroflow</h1>
        <p>Reset your account password</p>
      </div>

      <form id="resetForm">
        <div class="form-group">
          <label for="password">New Password</label>
          <input type="password" id="password" required minlength="8" placeholder="••••••••">
          <div class="error-msg" id="passwordError">Password must be at least 8 characters.</div>
        </div>

        <div class="form-group">
          <label for="confirmPassword">Confirm Password</label>
          <input type="password" id="confirmPassword" required minlength="8" placeholder="••••••••">
          <div class="error-msg" id="confirmPasswordError">Passwords do not match.</div>
        </div>

        <div class="error-msg" id="globalError" style="margin-bottom: 15px; text-align: center;"></div>

        <button type="submit" class="btn" id="submitBtn">Update Password</button>
      </form>
    </div>

    <div class="success-container" id="successContainer">
      <div class="success-icon">✓</div>
      <h2>Password Updated</h2>
      <p>Your password has been successfully reset. You can now close this window and log in with your new password.</p>
    </div>
  </div>

  <script>
    const resetForm = document.getElementById('resetForm');
    const passwordInput = document.getElementById('password');
    const confirmPasswordInput = document.getElementById('confirmPassword');
    const passwordError = document.getElementById('passwordError');
    const confirmPasswordError = document.getElementById('confirmPasswordError');
    const globalError = document.getElementById('globalError');
    const submitBtn = document.getElementById('submitBtn');
    const formWrapper = document.getElementById('formWrapper');
    const successContainer = document.getElementById('successContainer');

    resetForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      // Hide previous errors
      passwordError.style.display = 'none';
      confirmPasswordError.style.display = 'none';
      globalError.style.display = 'none';

      const password = passwordInput.value;
      const confirmPassword = confirmPasswordInput.value;

      let hasError = false;

      if (password.length < 8) {
        passwordError.style.display = 'block';
        hasError = true;
      }

      if (password !== confirmPassword) {
        confirmPasswordError.style.display = 'block';
        hasError = true;
      }

      if (hasError) return;

      submitBtn.disabled = true;
      submitBtn.innerText = 'Updating...';

      try {
        const response = await fetch('${apiEndpoint}', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            password: password,
            token: '${token}'
          })
        });

        const result = await response.json();

        if (response.ok && result.success) {
          formWrapper.style.display = 'none';
          successContainer.style.display = 'block';
        } else {
          globalError.innerText = result.message || 'Failed to reset password. Please check your link.';
          globalError.style.display = 'block';
          submitBtn.disabled = false;
          submitBtn.innerText = 'Update Password';
        }
      } catch (err) {
        console.error(err);
        globalError.innerText = 'A network error occurred. Please try again later.';
        globalError.style.display = 'block';
        submitBtn.disabled = false;
        submitBtn.innerText = 'Update Password';
      }
    });
  </script>
</body>
</html>`;
}

export function getResetErrorHtml(errorMessage: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Link Invalid or Expired - Aeroflow</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&display=swap" rel="stylesheet">
  <style>
    :root {
      --primary: #8a2be2;
      --bg-start: #0f0c1b;
      --bg-end: #201a30;
      --card-bg: rgba(255, 255, 255, 0.05);
      --card-border: rgba(255, 255, 255, 0.1);
      --text: #ffffff;
      --text-muted: #b0a8c0;
      --error: #ff4d4d;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
    }

    body {
      font-family: 'Outfit', sans-serif;
      background: linear-gradient(135deg, var(--bg-start) 0%, var(--bg-end) 100%);
      color: var(--text);
      min-height: 100vh;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
      overflow-x: hidden;
    }

    .container {
      width: 100%;
      max-width: 450px;
      background: var(--card-bg);
      border: 1px solid var(--card-border);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 15px 35px rgba(0, 0, 0, 0.5);
      text-align: center;
      animation: fadeIn 0.8s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; transform: translateY(20px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .error-icon {
      width: 80px;
      height: 80px;
      background: rgba(255, 77, 77, 0.1);
      border: 2px solid var(--error);
      color: var(--error);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 3rem;
      margin: 0 auto 20px;
    }

    h2 {
      font-size: 1.8rem;
      font-weight: 600;
      margin-bottom: 10px;
    }

    p {
      color: var(--text-muted);
      margin-bottom: 25px;
      line-height: 1.5;
    }

    .btn {
      display: inline-block;
      width: 100%;
      background: var(--primary);
      color: #ffffff;
      border: none;
      border-radius: 10px;
      padding: 14px;
      font-size: 1rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .btn:hover {
      opacity: 0.9;
      transform: translateY(-2px);
      box-shadow: 0 5px 15px rgba(138, 43, 226, 0.4);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="error-icon">✕</div>
    <h2>Link Expired or Invalid</h2>
    <p>${errorMessage}</p>
    <a href="#" onclick="window.close()" class="btn">Close Window</a>
  </div>
</body>
</html>`;
}
