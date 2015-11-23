var firepadRef = new Firebase('burning-inferno-4771.firebaseIO.com');
var codeMirror = CodeMirror(document.getElementById('firepad'), {
  lineNumbers: true,
  mode: 'javascript'
});
var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror, {
  defaultText: 'JavaScript Editing with Firepad!' 
});