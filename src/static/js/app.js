import hello from './test/test'

$(document).ready(() => {
  console.log(hello('World'))

  $('body')
    .animate({opacity: 0}, 500)
    .animate({opacity: 1.0}, 500)
})