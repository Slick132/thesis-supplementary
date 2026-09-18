(function () {
  'use strict';
  var factors = document.querySelector('.representation-demo #factor-angle');
  var light = document.querySelector('.representation-demo #factor-light');
  var object = document.querySelector('.representation-demo #factor-object');
  if (factors && light && object) {
    var updateFactors = function () {
      var angle = factors.value;
      var brightness = light.value;
      object.setAttribute('transform', 'rotate(' + angle + ' 120 110)');
      object.firstElementChild.style.fill = 'hsl(340, 50%, ' + brightness + '%)';
      document.getElementById('factor-angle-value').textContent = angle;
      document.getElementById('factor-light-value').textContent = brightness;
      document.getElementById('factor-attributes').textContent = 'Identity: L shape; orientation: ' + angle + ' degrees; brightness: ' + brightness + '%';
    };
    factors.addEventListener('input', updateFactors); light.addEventListener('input', updateFactors);
    updateFactors();
  }
  var distributed = document.querySelector('.representation-demo #attribute-object');
  if (!distributed) return;
  var updateDistributed = function () {
    var colour = document.querySelector('input[name="attribute-colour"]:checked').value;
    var shape = document.querySelector('input[name="attribute-shape"]:checked').value;
    var size = document.querySelector('input[name="attribute-size"]:checked').value;
    var radius = size === 'small' ? 30 : 52;
    var next = document.createElementNS('http://www.w3.org/2000/svg', shape === 'square' ? 'rect' : 'circle');
    next.setAttribute('id', 'attribute-object');
    next.setAttribute('fill', colour === 'teal' ? '#4A6670' : '#C2761F');
    var attributes = shape === 'square' ? {x:120-radius,y:90-radius,width:radius*2,height:radius*2} : {cx:120,cy:90,r:radius};
    Object.keys(attributes).forEach(function(key){next.setAttribute(key, attributes[key]);});
    distributed.replaceWith(next); distributed = next;
    document.getElementById('distributed-svg-title').textContent = size + ' ' + colour + ' ' + shape;
    document.getElementById('attribute-code').textContent = size + ' ' + colour + ' ' + shape;
    document.getElementById('attribute-label').textContent = 'colour: ' + colour + '; shape: ' + shape + '; size: ' + size;
  };
  document.querySelectorAll('.representation-demo input[type="radio"]').forEach(function (input) { input.addEventListener('change', updateDistributed); });
  updateDistributed();
}());
