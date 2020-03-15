function startGit() {
  $(document).ready(function() {
    BrowserFS.configure({ fs: "IndexedDB", options: {} }, function(err) {
      if (err) return console.log(err);
      window.fs = BrowserFS.BFSRequire("fs");
      git.plugins.set("fs", window.fs);
    });
  });
}
