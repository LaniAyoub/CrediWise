<!DOCTYPE html>
<html lang="${(locale.currentLanguageTag)!'en'}" dir="ltr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <meta name="robots" content="noindex, nofollow"/>
  <title>Sign In — CrediWise</title>
  <link rel="stylesheet" href="${url.resourcesPath}/css/crediwise.css"/>
</head>
<body>

<div class="cw-page">

  <!-- ── Brand logo ──────────────────────────────────────── -->
  <div class="cw-brand">
    <div class="cw-brand-badge">CW</div>
    <span class="cw-brand-name">CrediWise</span>
  </div>

  <!-- ── Card ────────────────────────────────────────────── -->
  <div class="cw-card">

    <h1 class="cw-heading">Welcome back</h1>
    <p class="cw-subheading">Sign in to your account to continue</p>

    <!-- ── Alert / flash message ─────────────────────────── -->
    <#if message?has_content>
      <div class="cw-alert cw-alert-${message.type}">
        <#if message.type == "error">
          <svg class="cw-alert-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"/>
          </svg>
        <#elseif message.type == "warning">
          <svg class="cw-alert-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"/>
          </svg>
        <#elseif message.type == "success">
          <svg class="cw-alert-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
        <#else>
          <svg class="cw-alert-icon" xmlns="http://www.w3.org/2000/svg" fill="none"
               viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round"
                  d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"/>
          </svg>
        </#if>
        <span>${message.summary}</span>
      </div>
    </#if>

    <!-- ── Login form ─────────────────────────────────────── -->
    <form action="${url.loginAction}" method="post" class="cw-form">

      <!-- Hidden credential field (required for WebAuthn / passkeys) -->
      <input type="hidden" id="id-hidden-input" name="credentialId"/>

      <!-- ── Username / Email ─────────────────────────────── -->
      <div class="cw-field">
        <label class="cw-label" for="username">
          <#if !realm.loginWithEmailAllowed>
            Username
          <#elseif !realm.registrationEmailAsUsername>
            Username or email
          <#else>
            Email address
          </#if>
        </label>
        <input
          id="username"
          name="username"
          type="<#if realm.loginWithEmailAllowed && realm.registrationEmailAsUsername>email<#else>text</#if>"
          value="${(login.username!'')}"
          autocomplete="username"
          autocapitalize="none"
          autocorrect="off"
          spellcheck="false"
          <#if usernameEditDisabled??>disabled</#if>
          <#if !usernameEditDisabled??>autofocus</#if>
          placeholder="<#if !realm.loginWithEmailAllowed>Enter your username<#elseif !realm.registrationEmailAsUsername>Enter username or email<#else>Enter your email</#if>"
          class="cw-input<#if messagesPerField.existsError('username','password')> cw-input--error</#if>"
        />
        <#if messagesPerField.existsError('username') && !messagesPerField.existsError('password')>
          <span class="cw-field-error">${messagesPerField.getFirstError('username')}</span>
        </#if>
      </div>

      <!-- ── Password ─────────────────────────────────────── -->
      <div class="cw-field">
        <div class="cw-label-row">
          <label class="cw-label" for="password">Password</label>
          <#if realm.resetPasswordAllowed>
            <a href="${url.loginResetCredentialsUrl}" class="cw-forgot" tabindex="5">
              Forgot password?
            </a>
          </#if>
        </div>

        <div class="cw-input-wrap">
          <input
            id="password"
            name="password"
            type="password"
            autocomplete="current-password"
            <#if usernameEditDisabled??>autofocus</#if>
            placeholder="Enter your password"
            class="cw-input cw-input--pwd<#if messagesPerField.existsError('username','password')> cw-input--error</#if>"
          />
          <button
            type="button"
            class="cw-pwd-toggle"
            aria-label="Toggle password visibility"
            tabindex="3"
            onclick="cwTogglePwd(this)"
          >
            <!-- Eye icon (visible state) -->
            <svg id="cw-eye-show" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.964-7.178z"/>
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
            </svg>
            <!-- Eye-slash icon (hidden state) — starts hidden -->
            <svg id="cw-eye-hide" xmlns="http://www.w3.org/2000/svg" fill="none"
                 viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"
                 style="display:none">
              <path stroke-linecap="round" stroke-linejoin="round"
                    d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88"/>
            </svg>
          </button>
        </div>

        <#if messagesPerField.existsError('username','password')>
          <span class="cw-field-error">
            ${messagesPerField.getFirstError('username','password')}
          </span>
        </#if>
      </div>

      <!-- ── Remember me ───────────────────────────────────── -->
      <#if realm.rememberMe && !usernameEditDisabled??>
        <label class="cw-remember">
          <input
            type="checkbox"
            id="rememberMe"
            name="rememberMe"
            class="cw-checkbox"
            tabindex="4"
            <#if login.rememberMe??>checked</#if>
          />
          <span class="cw-remember-label">Remember me for 8 hours</span>
        </label>
      </#if>

      <!-- ── Submit ─────────────────────────────────────────── -->
      <button type="submit" class="cw-submit" tabindex="4" name="login">
        Sign In
      </button>

    </form>

  </div><!-- /cw-card -->

  <p class="cw-footer">
    &copy; ${.now?string("yyyy")} CrediWise &middot; Credit Management Platform
  </p>

</div><!-- /cw-page -->

<script>
  /**
   * Toggle password field between text and password types.
   * Swaps the two SVG icons to reflect the current state.
   */
  function cwTogglePwd(btn) {
    var input = document.getElementById('password');
    var iconShow = document.getElementById('cw-eye-show');
    var iconHide = document.getElementById('cw-eye-hide');
    if (input.type === 'password') {
      input.type = 'text';
      iconShow.style.display = 'none';
      iconHide.style.display = '';
      btn.setAttribute('aria-label', 'Hide password');
    } else {
      input.type = 'password';
      iconShow.style.display = '';
      iconHide.style.display = 'none';
      btn.setAttribute('aria-label', 'Show password');
    }
    /* Keep focus on the input after toggle */
    input.focus();
  }
</script>

</body>
</html>
