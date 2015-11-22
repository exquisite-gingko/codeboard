var firepadRef = new firebase('burning-inferno-4771.firebaseIO.com');
var codeMirror = codeMirror(document.getElementById('firepad'), { lineWrapping: true });
var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror, {
    richTextShortcuts: true,
    richTextToolbar: true,
    defaultText: 'Hello, World!' 
  });
