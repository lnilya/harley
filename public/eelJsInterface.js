//Not that this file needs to be a .js file otherwise eel won't be able to detect it.
//Second the expose function needs to be literally "eel.expose...", since the way eel
//works is to scan .js files for the occurance of eel . expose(...)

var eel = window['eel'];
if(eel){
    eel.expose(progress,'progress');
    function progress(x,msg) {
        window.__eel_js_progress(x,msg);
    }
    eel.expose(asyncFinished,'asyncFinished');
    function asyncFinished(callbackID,data) {
        window.__eel_js_asyncFinished(callbackID,data);
    }
    eel.expose(asyncError,'asyncError');
    function asyncError(callbackID,data) {
        window.__eel_js_asyncError(callbackID,data);
    }
}
