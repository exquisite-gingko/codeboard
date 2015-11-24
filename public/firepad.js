var firepadRef = new Firebase('burning-inferno-4771.firebaseIO.com');
var codeMirror = CodeMirror(document.getElementById('firepad'), {
  lineNumbers: true,
  mode: 'javascript',
  theme: 'cobalt'
});
var firepad = Firepad.fromCodeMirror(firepadRef, codeMirror, {
  defaultText: 'Start your javascript here!' 
});