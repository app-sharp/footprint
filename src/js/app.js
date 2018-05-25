// Form Handling
var theForm = document.getElementById( 'contact' );

new stepsForm( theForm, {
  onSubmit : function( form ) {
    classie.addClass( theForm.querySelector( '.simform-inner' ), 'hide' );

    // form.submit()
    postAjax(form.getAttribute("action"), serialize(document.forms[0]), function(){
      var messageEl = theForm.querySelector( '.final-message' );
      messageEl.innerHTML = 'Thank you! We\'ll be in touch.';
      classie.addClass( messageEl, 'show' );
    }, function(failed) {
      if (failed) {
        var messageEl = theForm.querySelector( '.final-message' );
        messageEl.innerHTML = 'There was an error. Try <a href="mailto:info@appsharp.com">emailing us</a> directly.';
        classie.addClass( messageEl, 'show' );
      }
    });
  }
} );

// Form Posting
function postAjax(url, data, success, error) {
  var params = typeof data == 'string' ? data : Object.keys(data).map(
          function(k){ return encodeURIComponent(k) + '=' + encodeURIComponent(data[k]) }
      ).join('&');

  var xhr = window.XMLHttpRequest ? new XMLHttpRequest() : new ActiveXObject("Microsoft.XMLHTTP");
  xhr.open('POST', url);
  xhr.onreadystatechange = function() {
      if (xhr.readyState>3 && xhr.status==200) {
        success(xhr.responseText);
      } else { error(true);}
  };
  xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
  xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
  xhr.send(params);
  return xhr;
}
