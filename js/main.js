(function(w, d) {
  'use strict';

  // ZaPOST
  //
  // Submits form contents to a nominated Zapier webhook.
  //
  // Example:
  //  <form data-zapier="https://hooks.zapier.com/hooks/catch/1234/asdf/">
  //    <input type="text" name="foo">
  //    <button type="submit">Submit</button>
  //  </form>
  //
  //  When the submit button is clicked, the default submit event is
  //  intercepted. ZaPOST would then send {'foo':'Foo's value in the form'} to
  //  the zap for processing. Given an OK from Zapier, ZaPOST will replace the
  //  form with a thank-you message. Disabling and enabling the submit button
  //  is handled by ZaPOST.
  var ZaPOST = function(form) {
    this.form = form;
    this.submitButton = form.querySelector('[type=submit]');
    this.zapierWebhook = form.getAttribute('data-zapier');
    this.httpRequest = new XMLHttpRequest();
    return this;
  };

  ZaPOST.prototype.submit = function() {
    this.form.querySelector('.loading').style.display = 'block';
    this.form.querySelector('.fields').style.display = 'none';
    this
      ._disableSubmitButton()
      ._postToZapier();
  };

  ZaPOST.prototype._disableSubmitButton = function() {
    this.submitButton.setAttribute('disabled', '');
    return this;
  };

  ZaPOST.prototype._enableSubmitButton = function() {
    this.submitButton.removeAttribute('disabled');
    return this;
  };

  ZaPOST.prototype._postToZapier = function() {
    this.httpRequest.onreadystatechange = this._handleZapierResponse.bind(this);
    this.httpRequest.open('POST', this.zapierWebhook, true);
    this.httpRequest.send(this._serialize());
  };

  ZaPOST.prototype._handleZapierResponse = function() {
    if (this.httpRequest.readyState === XMLHttpRequest.DONE) {
      this.form.querySelector('.loading').classList.add("loading__tick");
      this._enableSubmitButton();

      if (this.httpRequest.status === 200) {
        this.form.querySelector('.thank_you').style.display = 'block';
        // TODO: localStorage.removeItem('source');
      }
    }
  };

  ZaPOST.prototype._serialize = function() {
    var params = {};

    Array.prototype.forEach.call(
      this.form.querySelectorAll('input, select, textarea'),
      function(element) {
        if (element.value.length > 0) {
          params[element.name] = element.value;
        }
      }
    );

    // merge in source attributes
    var source = {};

    try {
      source = JSON.parse(w.localStorage.getItem('source'));
    } catch (e) {
      if (e instanceof SyntaxError) {
        console.error('The persisted source was not valid JSON.');
      } else {
        throw e;
      }
    }

    Object.assign(params, source);
    return JSON.stringify(params);
  };

  // Initialisation
  // Listens to the submit event on the document. Identifies applicable forms
  // and hands them off to ZaPOST to submit.
  d.addEventListener('submit', function(e) {
    var form = e.target;

    if (!form.getAttribute('data-zapier')) {
      return;
    }

    e.preventDefault();
    (new ZaPOST(form)).submit();
  });
})(window, document);
