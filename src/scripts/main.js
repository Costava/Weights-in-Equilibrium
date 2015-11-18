console.log("main");

function App() {
	// An App instance should be given these 2 properties
	// this.c//   canvas element
	// this.ctx// canvas element 2d context

	// this.targets should be left undefined at instantiation
	//  so that the source in targetValuesFail function
	//  can easily fall back to this.wequ if this.targets is not yet defined
	// this.targets = {};

	// this.finalBobHangLength;
	// ^ will be defined by
	//  App.prototype.targetValuesSuccess

	// Jump to final value if difference
	//  between this.finalBobHangLength and current value
	//  is [x] or smaller
	this.jumpDifference = 0.06;

	// The loop eases the change in the graphical represenation
	//  of the weight system
	this.looping = false;

	// Whether to save new frames as they are drawn to .png
	this.savingFrames = false;
	// Incremented every time a frame is saved
	// First frame will be frame 1
	this.frameNumber = 0;
}

// http://stackoverflow.com/questions/10673122/how-to-save-canvas-as-an-image-with-canvas-todataurl
// Thank you to Stack Overflow users user1874941 and gillyb
App.prototype.saveFrame = function() {
	this.frameNumber += 1;

	var image = this.c.toDataURL("image/png").replace("image/png", "image/octet-stream");

	var a = document.createElement('a');
	a.href = image;
	a.download = 'frame' + this.frameNumber + '.png';

	document.body.appendChild(a);
	a.click();
	// The behavior following depends on your browser settings:
	//  You may get a save dialog
	//  Image may be automatically saved to designated downloads folder
};

App.prototype.drawWequ = function() {
	app.ctx.clearRect(0, 0, app.c.width, app.c.height);
	app.wequ.draw(app.ctx);
};

App.prototype.getTargetValues = function() {
	// Retrieve values and cast to number from string with "+"
	var newPulleyLength = +document.querySelector('.js-pulley-length').value;
	var newSideMass = +document.querySelector('.js-side-mass').value;
	var newCenterMass = +document.querySelector('.js-center-mass').value;

	var newValues = {pulleyLength: newPulleyLength, sideMass: newSideMass, centerMass: newCenterMass};

	return newValues;
};

App.prototype.targetValuesFail = function(values) {
	console.log("Target value(s) not valid");

	var source;
	// source falls back to this.wequ if no targets
	if (this.targets === undefined || Object.keys(this.targets).length === 0 /* has no properties */) {
		source = this.wequ;
	}
	else {
		source = this.targets;
	}

	document.querySelector('.js-pulley-length').value = source.pulleyLength;
	document.querySelector('.js-side-mass').value = source.sideMass;
	document.querySelector('.js-center-mass').value = source.centerMass;

	var uniqueClass = 'js-mass-problem-' + new Date().getTime();

	// The modal cannot be appended to body because that will break the canvas for some reason
	document.querySelector('.js-modal-container').innerHTML += '<div class="modal notification ' + uniqueClass + '">The combined mass of the side blocks must be greater than the mass of the center block.</div>';

	(function(classHook) {
		setTimeout(function() {
			document.querySelector('.' + classHook).style.opacity = 0;
		}, 4500);
	})(uniqueClass);

	(function(classHook) {
		setTimeout(function() {
			var elem = document.querySelector('.' + classHook);
			elem.parentNode.removeChild(elem);
		}, 5000);
	})(uniqueClass);
};
App.prototype.targetValuesSuccess = function(values) {
	// console.log("Target values are valid");

	// Calculate final bob hang length with an app.wequ clone
	var clone = new Wequ();
	for (var prop in app.wequ) {
		clone[prop] = app.wequ[prop];
	}
	// Apply new values to clone
	for (prop in values) {
		clone[prop] = values[prop];
	}

	clone.updateHangLengths();

	this.finalBobHangLength = clone.bobHangLength;

	// clone used because pulley distance property is used to convert units
	document.querySelector('.js-bob-hang').innerHTML = clone.pixelsToMeters(this.finalBobHangLength);

	// Size the side blocks to better show relative mass
	var finalWeightSideLength = ( Math.pow(values.sideMass, 2) / Math.pow(values.centerMass, 2) )
								 * this.wequ.bobSideLength;

	values.weightSideLength = finalWeightSideLength;

	this.targets = values;

	this.looping = true;
	this.loop();
};

App.prototype.loop = function() {
	// console.log("loop");
	for (var prop in this.targets) {
		var diff = this.targets[prop] - this.wequ[prop];
		diff *= 0.05;

		this.wequ[prop] += diff;
	}

	this.wequ.updateHangLengths();
	var newBobHang = this.wequ.bobHangLength;

	var bobHangDifference = Math.abs(this.finalBobHangLength - newBobHang);
	if (bobHangDifference <= this.jumpDifference) {
		for (var prop in this.targets) {
			this.wequ[prop] = this.targets[prop];
		}

		// console.log("Done looping");
		this.looping = false;
	}

	this.drawWequ();

	if (this.savingFrames) {
		this.saveFrame();
	}

	if (this.looping) {
		window.requestAnimationFrame(function() {
			this.loop();
		}.bind(this));
	}
};

App.valuesValid = function(values) {
	if (values.pulleyLength === undefined ||
		values.sideMass === undefined ||
		values.centerMass === undefined)
		{
		return false;
	}

	if (values.centerMass >= 2 * values.sideMass) {
		return false;
	}

	return true;
};

App.prototype._applyValues = function(values) {
	if (!App.valuesValid(values)) {
		this.targetValuesFail(values);
	}
	else {
		this.targetValuesSuccess(values);
	}
};
App.prototype.applyValues = function() {
	this._applyValues(this.getTargetValues());
}

var app = new App();

app.c = document.querySelector('.js-canvas');
app.ctx = app.c.getContext('2d');

app.wequ = new Wequ();
app.wequ.scale = 3;
app.wequ.draw(app.ctx);

app.update = function() {
	app.applyValues();
};

// Bind "Update" button
document.querySelector('.js-update').addEventListener('click', app.update);

// Update app with new values when a value changes
document.querySelector('.js-pulley-length').addEventListener('change', app.update);
document.querySelector('.js-side-mass').addEventListener('change', app.update);
document.querySelector('.js-center-mass').addEventListener('change', app.update);

// Bind enter key
document.addEventListener('keydown', function(e) {
	// console.log("e.keyCode:", e.keyCode);
	if (e.keyCode === 13) {// Enter key
		app.update();
	}
});

// Initial run
app.update();
