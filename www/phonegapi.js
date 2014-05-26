/*
 * Helper routines for using phonegap with google's GAPI
 *
 * Phonegap gapi.auth.signIn and gapi.auth.authorize will not work with phonegap because the redirect
 * has to go to file: URI, which is not supported. Provide alternate API's for managing
 * authorization/authentication
 *
 */
var phonegapi = {};

(function() {
    var loginWindow;

    /*
     * Config for google authentication. The same for all apps
     */
    var gapiConfig = {
        auth_uri: 'https://accounts.google.com/o/oauth2/auth',
        token_uri: 'https://accounts.google.com/o/oauth2/token',
        redirect_uri: 'http://localhost'
    };

    var logJSON = function(mess, json) {
        console.log(mess + json ? JSON.stringify(json, null, 2) : '');
    };

    /*
     * Authentication/Authorization is a 3 step process:
     *   1 Open a browser and navigate to a URI with a URI that requests authentication
     *   2 Catch every time the browser changes URI and watch for a URI that contains a code
     *   3 When the code is received exchange the code for tokens
     */

    /*
     * Step 1: Open a browser on a login page
     */
    var openLogin = function(params) {
        // open Cordova inapp-browser with login page
        // Pass in app info
        var login_uri = gapiConfig.auth_uri
            + '?client_id=' + params.client_id
            + '&redirect_uri=' + gapiConfig.redirect_uri
            + '&response_type=code'
            + '&scope=' + params.scope;
        loginWindow = window.open(login_uri, '_blank', 'location=yes');

        // Watch when a new page is loaded to see the redirects
        $(loginWindow).on('loadstart', function(e) { onLoadStart(e, params);});
    };

    /*
     * Step 2: Catch the URI changes in the login browser
     */
    var onLoadStart = function(e, params) {
        logJSON('onLoadStart');
        var url = e.originalEvent.url;
        var code = /\?code=(.+)$/.exec(url);
        var error = /\?error=(.+)$/.exec(url);

        if (code || error)
            loginWindow.close();

        if (code) {
            getTokens(code[1], params);
        } else if (error) {
            logJSON('error: ' + error);
            params.callback('login failed: ' + error);
        }
    };

    /*
     * Step 3: Exchange the authorization code for access/refresh tokens
     */
    var getTokens = function(code, params) {
        logJSON('getTokens: ' + code);
        $.ajax({
            url: gapiConfig.token_uri,
            data: {
                code: code,
                client_id: params.client_id,
                client_secret: params.client_secret,
                redirect_uri: gapiConfig.redirect_uri,
                grant_type: 'authorization_code'
            },
            type: 'POST',
            dataType: 'json',
            success: function(data){
                // got access_token
                var tokens = data;
                logJSON('tokens received: ', tokens);
                gapi.auth.setToken(tokens);
                params.callback(null, tokens);
            },
            error: function(error){
                // could not get token
                params.callback('login failed: ' + error);
            }
        });
    };

    var refreshTokens = function(tokens, params) {
        logJSON('refreshTokens: ', tokens);
        $.ajax({
            url: gapiConfig.token_uri,
            data: {
                refresh_token: tokens.refresh_token,
                client_id: params.client_id,
                client_secret: params.client_secret,
                grant_type: 'refresh_token'
            },
            type: 'POST',
            dataType: 'json',
            success: function(data){
                // got access_token
                tokens = data;
                logJSON('tokens received: ', tokens);
                gapi.auth.setToken(tokens);
            },
            error: function(error){
                // could not get token
                params.callback('login failed: ' + error);
            }
        });
    };

    /*
     * Exported functions
     */

    /*
     * Sign in to google and request access to API's. After successful
     * authentication, calls to gapi.*.* that require authentication will
     * work.
     *
     * param: An object with parameters for the sign in
     *        {
     *              client_id: 'Get client id from Google developer console',
     *              client_secret: 'Get client secret from google developer console',
     *              scope: 'Scope describes the APIs that will be used',
     *              callback: function(error, tokens) {
     *                   if (error) console.log('error: ' + error);
     *                    else console.log(JSON.stringify(tokens, null, 2);
     *              }
     *        }
     */
    phonegapi.signIn = function(param) {
        openLogin(param);
    };

    /*
     * Sign out, pass current tokens to the callback parameter.
     * gapi calls will fail if they require authentication
     * Call phonegap.refreshSignin(token) to re-authenticate. User
     * will not have to go through login page again.
     *
     * callback: callback is called and passed the current tokens
     */
    phonegapi.signOut = function(callback) {
        var tokens = gapi.auth.getToken();
        gapi.auth.setToken(null);
        if (callback)
            callback(tokens);
    };

    /*
     * Access tokens expire after 1 hour. Call this function to refresh the tokens.
     *
     * tokens: tokens obtained by an earlier call to signIn or refreshSignIn
     * params: same as passed to signIn
     *
     */
    phonegapi.refreshSignIn = function(tokens, params) {
        refreshTokens(tokens, params);
    }
})();

