Helper routines for using phonegap / cordova with Google's gapi.

gapi is a set of API's that google provides for accessing their services. If you are using phonegap or cordova, 
gapi.auth.signIn and gapi.auth.authorize will not work because the oauth redirect
can only go to a file: URI, which is not supported by gapi. Provide alternate API's for 
managing authorization/authentication. You can authenticate with phonegapi and then use the other gapi API's
that require authentication.

Calling the API's
--------------
Add the following script tags to your index.html. phonegapi requires jquery and the google client.js file

    <script type="text/javascript" src="jquery-1.11.1.js"></script>
    <script src="https://apis.google.com/js/client.js"></script>
    <script src="phonegapi.js"></script>
    
The code uses the cordova inappbrowser plugin. If you are using cordova CLI, do:
    cordova plugin add org.apache.cordova.inappbrowser
    
See test.js for examples on how to sign in, persist the tokens in local storage, refresh tokens if they expire,...

Creating credentials
--------------------
When creating credentials in google developer console. Selected 'Installed App' and then then 'other'. You will
need the client id and client secret to call signIn and refreshSignIn.

API synopsis
------------

phonegapi.signIn: Use login screen to obtain the access tokens for google authenticated APIs
phonegapi.signOut: Disable the access tokens so google API's will fail
phonegapi.refreshSignIn: Refresh the tokens obtained earlier to get access without going through a login screen