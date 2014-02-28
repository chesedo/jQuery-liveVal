// Copyright (C) 2013  Pieter Engelbrecht

// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.

// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
// GNU General Public License for more details.

// You should have received a copy of the GNU General Public License
// along with this program. If not, see <http://www.gnu.org/licenses/>.


/*
    USING THIS PLUGIN
    =================
    Simple call it on any single input eg.($('#input-one').validate(options, checker)) - This plugin requires bootstraps's tooltip included below

    Options should be an object used to overwrite the defaults. the following are the default with discription
        errorClassParent    : '.control-group'             The parent element to add the error classes to - on blur
        errorMissingClass   : 'error'                      Class to add when value is missing
        errorClass          : 'warning'                    Class to add when there is an error with the input
        required            : false                        Set whether an input is required
        requiredHtml        : '<span style="color: red">*</span>' HTML to append to label when input is required - after isRequired is called

    Checker(string) is the checker to attach to the input's keyup event. The following is build in
        isText      Checks that the input does not contain digits or symbols
        isNumber    Checks that the input contains only digits
        isEmail     Checks if input contains a valid email
        isAlphaNum  Checks that the input does not contain symbols (only letters and digits pass)

        Others can easily be added to $.fn.validate.checks.(newCheck). Example of the isNumber check
            $.fn.validate.checks.isNumber    : function(val) {
                                                var number = /\D/;

                                                if (number.test(val)) return $.fn.validate.errors.onlyDigits;

                                                return true;
                                              }
            val is the value in the input passed to the check.
            Return can be an error string which will be displayed in the tooltip when the check fails or true if it passed - $.fn.validate.errors.(errors) is where the default error can be overwriten (or translated)


    Changing the errors
    ===================
    The defaults can be overwriten at $.fn.validate.errors.(error) = 'new error'; in a js file
    error is the name of the error and include the following noSymbols, noDigits, onlyDigits and invalidEmail as default. You can at more for your own checks as well.

    Extra Functions
    ===============
    The following fuctions might be usefull. They are all called on a validate jQuery object ($object = $('input').validate()) using $object.(function)
        setRequired(true|false) - Set whether an input is required
        getError - Gets the error of the input (false means no error, 0 means is missing and other text, which will contains the error from the tooltip, means that the input did not pass the check)
 */
(function($) {

    $.fn.validate = function(options, check) {
        //var input = this;
        var $this = this,
            error = false,
            opts  = (typeof options === 'object') ? $.extend({}, $.fn.validate.defaults, options) : $.extend({}, $.fn.validate.defaults),
            check = (typeof options === 'string') ? options : check;

        //Checks to see that a single input called the plugin
        if ($this.length > 1) $.error($this.selector + ' is not a single input - this plugin can only be called on a single input');
        if (!$this.is('input')) $.error($this.selector + ' is not an input or matches nothing');

        $this.attr('title', '').tooltip({'placement': 'bottom', 'trigger': 'focus', 'html': true, 'animation': false});

        if (typeof $.fn.validate.checks[check] === 'function') {
            /*
            Input events detect autocomplete with pastes
            Keyup is for IE < 9 which does not support input
             */
            $this.on('input propertychange', function(e) {
                // If it's the propertychange event, make sure it's the value that changed.
                // Else a loop happens in IE when the class and title of tooltip update triggers propertychange
                if (window.event && event.type == "propertychange" && event.propertyName != "value")
                    return;

                e.stopPropagation();
                error = $.fn.validate.checks[check](this.value);

                if (typeof error === 'boolean') error = !error;
                else if (typeof error === 'object') error = error.join('<br />');
                $this.updateKeyUp();
            });
        }

        $this.blur(function(e) {
            e.stopPropagation();
            val = this.value;
            valT = $.trim(val);
            //if value and trimmed value not the same then padding space - so remove it
            if (val != valT)
              $this.val(valT);
            //Reset error count and check again if value not blank
            error = false;
            if (valT !== '') {
                $this.tooltip('hide');
                $this.trigger('input');
            } else if (opts.required) {
                error = 0;
            }

            $this.updateLostFocus();
        });

        this.updateLostFocus = function() {
            $this.parents(opts.errorClassParent).removeClass(opts.errorMissingClass).removeClass(opts.errorClass);
            if (error !== false) {
                if (error == 0) {
                    $this.parents(opts.errorClassParent).addClass(opts.errorMissingClass);
                } else {
                    $this.parents(opts.errorClassParent).addClass(opts.errorClass);
                }
            }
        };

        this.updateKeyUp = function() {
            if (error !== false && error != 0) {
                $this.attr('title', error).tooltip('fixTitle').tooltip('enable').tooltip('show');
            } else {
                $this.attr('title', ' ').tooltip('fixTitle').tooltip('hide').tooltip('disable');
            }
        };

        this.setRequired = function(req) {
            opts.required = req;

            var $label = $('[for="' + $this.attr('id') + '"]'),
                $requiredHtml = $(opts.requiredHtml),
                requiredClass = '.' + $requiredHtml.attr('class').replace(' ', '.'),
                reqWidth;

            if ($label.length === 1) {
                if (req) {
                    if ($label.find(requiredClass).length === 0) {
                        $requiredHtml.appendTo($label).css({'display': 'inline-block', 'overflow': 'hidden'});
                        reqWidth = $requiredHtml.width();
                        $requiredHtml.css('width', '0').animate({'width': reqWidth}, 600);

                    }
                } else {
                    $label.find(requiredClass).animate({'width': '0'}, 500, function() {$(this).remove()});
                }
            }

            return $this;
        }

        this.getError = function() {
            $this.blur();
            if (error !== 0 && error !== false) return true;

            return error;
        }
        return $this;
    };
    $.fn.validate.defaults = {
        errorClassParent    : '.control-group',
        errorMissingClass   : 'error',
        errorClass          : 'warning',
        required            : false,
        requiredHtml        : '<span style="color: red">*</span>'
    };
    $.fn.validate.errors = {
        noSymbols       : 'No symbols allowed',
        noDigits        : 'No digits allowed',
        onlyDigits     : 'Only digits allowed',
        invalidEmail    : 'Not a valid email'
    };
    $.fn.validate.checks = {
        isText      : function(val) {
                        var symbols = /[!-/:-@{-~[-`]/,
                            numbers = /\d/,
                            error = [];

                        if (symbols.test(val)) {
                            error.push($.fn.validate.errors.noSymbols);
                        }

                        if (numbers.test(val)) {
                            error.push($.fn.validate.errors.noDigits);
                        }

                        if (error.length > 0) return error;
                        return true;
                      },
        isNumber    : function(val) {
                        var number = /\D/;

                        if (number.test(val)) return $.fn.validate.errors.onlyDigits;

                        return true;
                      },
        isEmail     : function(val) {
                        var email = /^([a-zA-Z0-9_\.\-])+\@(([a-zA-Z0-9\-])+\.)+([a-zA-Z0-9]{2,4})+$/;

                        if (!email.test(val)) return $.fn.validate.errors.invalidEmail;
                        return true;
                      },
        isAlphaNum  : function(val) {
                        var symbols = /[!-/:-@{-~[-`]/;

                        if (symbols.test(val)) return $.fn.validate.errors.noSymbols;

                        return true;
                      }
    };
})(jQuery);

/* ===========================================================
 * bootstrap-tooltip.js v2.3.2
 * http://twitter.github.com/bootstrap/javascript.html#tooltips
 * Inspired by the original jQuery.tipsy by Jason Frame
 * ===========================================================
 * Copyright 2012 Twitter, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================== */


!function ($) {

  "use strict"; // jshint ;_;


 /* TOOLTIP PUBLIC CLASS DEFINITION
  * =============================== */

  var Tooltip = function (element, options) {
    this.init('tooltip', element, options)
  }

  Tooltip.prototype = {

    constructor: Tooltip

  , init: function (type, element, options) {
      var eventIn
        , eventOut
        , triggers
        , trigger
        , i

      this.type = type
      this.$element = $(element)
      this.options = this.getOptions(options)
      this.enabled = true

      triggers = this.options.trigger.split(' ')

      for (i = triggers.length; i--;) {
        trigger = triggers[i]
        if (trigger == 'click') {
          this.$element.on('click.' + this.type, this.options.selector, $.proxy(this.toggle, this))
        } else if (trigger != 'manual') {
          eventIn = trigger == 'hover' ? 'mouseenter' : 'focus'
          eventOut = trigger == 'hover' ? 'mouseleave' : 'blur'
          this.$element.on(eventIn + '.' + this.type, this.options.selector, $.proxy(this.enter, this))
          this.$element.on(eventOut + '.' + this.type, this.options.selector, $.proxy(this.leave, this))
        }
      }

      this.options.selector ?
        (this._options = $.extend({}, this.options, { trigger: 'manual', selector: '' })) :
        this.fixTitle()
    }

  , getOptions: function (options) {
      options = $.extend({}, $.fn[this.type].defaults, this.$element.data(), options)

      if (options.delay && typeof options.delay == 'number') {
        options.delay = {
          show: options.delay
        , hide: options.delay
        }
      }

      return options
    }

  , enter: function (e) {
      var defaults = $.fn[this.type].defaults
        , options = {}
        , self

      this._options && $.each(this._options, function (key, value) {
        if (defaults[key] != value) options[key] = value
      }, this)

      self = $(e.currentTarget)[this.type](options).data(this.type)

      if (!self.options.delay || !self.options.delay.show) return self.show()

      clearTimeout(this.timeout)
      self.hoverState = 'in'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'in') self.show()
      }, self.options.delay.show)
    }

  , leave: function (e) {
      var self = $(e.currentTarget)[this.type](this._options).data(this.type)

      if (this.timeout) clearTimeout(this.timeout)
      if (!self.options.delay || !self.options.delay.hide) return self.hide()

      self.hoverState = 'out'
      this.timeout = setTimeout(function() {
        if (self.hoverState == 'out') self.hide()
      }, self.options.delay.hide)
    }

  , show: function () {
      var $tip
        , pos
        , actualWidth
        , actualHeight
        , placement
        , tp
        , e = $.Event('show')

      if (this.hasContent() && this.enabled) {
        this.$element.trigger(e)
        if (e.isDefaultPrevented()) return
        $tip = this.tip()
        this.setContent()

        if (this.options.animation) {
          $tip.addClass('fade')
        }

        placement = typeof this.options.placement == 'function' ?
          this.options.placement.call(this, $tip[0], this.$element[0]) :
          this.options.placement

        $tip
          .detach()
          .css({ top: 0, left: 0, display: 'block' })

        this.options.container ? $tip.appendTo(this.options.container) : $tip.insertAfter(this.$element)

        pos = this.getPosition()

        actualWidth = $tip[0].offsetWidth
        actualHeight = $tip[0].offsetHeight

        switch (placement) {
          case 'bottom':
            tp = {top: pos.top + pos.height, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'top':
            tp = {top: pos.top - actualHeight, left: pos.left + pos.width / 2 - actualWidth / 2}
            break
          case 'left':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left - actualWidth}
            break
          case 'right':
            tp = {top: pos.top + pos.height / 2 - actualHeight / 2, left: pos.left + pos.width}
            break
        }

        this.applyPlacement(tp, placement)
        this.$element.trigger('shown')
      }
    }

  , applyPlacement: function(offset, placement){
      var $tip = this.tip()
        , width = $tip[0].offsetWidth
        , height = $tip[0].offsetHeight
        , actualWidth
        , actualHeight
        , delta
        , replace

      $tip
        .offset(offset)
        .addClass(placement)
        .addClass('in')

      actualWidth = $tip[0].offsetWidth
      actualHeight = $tip[0].offsetHeight

      if (placement == 'top' && actualHeight != height) {
        offset.top = offset.top + height - actualHeight
        replace = true
      }

      if (placement == 'bottom' || placement == 'top') {
        delta = 0

        if (offset.left < 0){
          delta = offset.left * -2
          offset.left = 0
          $tip.offset(offset)
          actualWidth = $tip[0].offsetWidth
          actualHeight = $tip[0].offsetHeight
        }

        this.replaceArrow(delta - width + actualWidth, actualWidth, 'left')
      } else {
        this.replaceArrow(actualHeight - height, actualHeight, 'top')
      }

      if (replace) $tip.offset(offset)
    }

  , replaceArrow: function(delta, dimension, position){
      this
        .arrow()
        .css(position, delta ? (50 * (1 - delta / dimension) + "%") : '')
    }

  , setContent: function () {
      var $tip = this.tip()
        , title = this.getTitle()

      $tip.find('.tooltip-inner')[this.options.html ? 'html' : 'text'](title)
      $tip.removeClass('fade in top bottom left right')
    }

  , hide: function () {
      var that = this
        , $tip = this.tip()
        , e = $.Event('hide')

      this.$element.trigger(e)
      if (e.isDefaultPrevented()) return

      $tip.removeClass('in')

      function removeWithAnimation() {
        var timeout = setTimeout(function () {
          $tip.off($.support.transition.end).detach()
        }, 500)

        $tip.one($.support.transition.end, function () {
          clearTimeout(timeout)
          $tip.detach()
        })
      }

      $.support.transition && this.$tip.hasClass('fade') ?
        removeWithAnimation() :
        $tip.detach()

      this.$element.trigger('hidden')

      return this
    }

  , fixTitle: function () {
      var $e = this.$element
      if ($e.attr('title') || typeof($e.attr('data-original-title')) != 'string') {
        $e.attr('data-original-title', $e.attr('title') || '').attr('title', '')
      }
    }

  , hasContent: function () {
      return this.getTitle()
    }

  , getPosition: function () {
      var el = this.$element[0]
      return $.extend({}, (typeof el.getBoundingClientRect == 'function') ? el.getBoundingClientRect() : {
        width: el.offsetWidth
      , height: el.offsetHeight
      }, this.$element.offset())
    }

  , getTitle: function () {
      var title
        , $e = this.$element
        , o = this.options

      title = $e.attr('data-original-title')
        || (typeof o.title == 'function' ? o.title.call($e[0]) :  o.title)

      return title
    }

  , tip: function () {
      return this.$tip = this.$tip || $(this.options.template)
    }

  , arrow: function(){
      return this.$arrow = this.$arrow || this.tip().find(".tooltip-arrow")
    }

  , validate: function () {
      if (!this.$element[0].parentNode) {
        this.hide()
        this.$element = null
        this.options = null
      }
    }

  , enable: function () {
      this.enabled = true
    }

  , disable: function () {
      this.enabled = false
    }

  , toggleEnabled: function () {
      this.enabled = !this.enabled
    }

  , toggle: function (e) {
      var self = e ? $(e.currentTarget)[this.type](this._options).data(this.type) : this
      self.tip().hasClass('in') ? self.hide() : self.show()
    }

  , destroy: function () {
      this.hide().$element.off('.' + this.type).removeData(this.type)
    }

  }


 /* TOOLTIP PLUGIN DEFINITION
  * ========================= */

  var old = $.fn.tooltip

  $.fn.tooltip = function ( option ) {
    return this.each(function () {
      var $this = $(this)
        , data = $this.data('tooltip')
        , options = typeof option == 'object' && option
      if (!data) $this.data('tooltip', (data = new Tooltip(this, options)))
      if (typeof option == 'string') data[option]()
    })
  }

  $.fn.tooltip.Constructor = Tooltip

  $.fn.tooltip.defaults = {
    animation: true
  , placement: 'top'
  , selector: false
  , template: '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'
  , trigger: 'hover focus'
  , title: ''
  , delay: 0
  , html: false
  , container: false
  }


 /* TOOLTIP NO CONFLICT
  * =================== */

  $.fn.tooltip.noConflict = function () {
    $.fn.tooltip = old
    return this
  }

}(window.jQuery);
