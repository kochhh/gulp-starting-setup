(function () {
  'use strict';

  var hello = function hello(name) {
    return "Hello, ".concat(name, "!");
  };

  $(document).ready(function () {
    console.log(hello('World'));
    $('body').animate({
      opacity: 0
    }, 500).animate({
      opacity: 1.0
    }, 500);
  });

}());
