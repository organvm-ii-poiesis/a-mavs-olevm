// LOOPHOLE RANDOMIZER
function randomlinks() {
  var myrandom = Math.round(Math.random() * 12);
  var links = new Array();
  links[0] = 'labyrinth/040615.html';
  links[1] = 'labyrinth/040715.html';
  links[2] = 'labyrinth/040815.html';
  links[3] = 'labyrinth/040915.html';
  links[4] = 'labyrinth/041015.html';
  links[5] = 'labyrinth/041315.html';
  links[6] = 'labyrinth/041415.html';
  links[7] = 'labyrinth/041715.html';
  links[8] = 'labyrinth/042115.html';
  links[9] = 'labyrinth/042215.html';
  links[10] = 'labyrinth/051815.html';
  links[11] = 'labyrinth/072716.html';
  window.location = links[myrandom];
}

var totalCount = 99;
function ChangeIt() {
  var num = Math.ceil(Math.random() * totalCount);
  document.body.background = 'bgimages/' + num + '.jpg';
  document.body.style.backgroundRepeat = 'repeat'; // Background repeat
}

ChangeIt();
