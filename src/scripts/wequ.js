console.log("wequ!");

function Wequ() {
	this.renderWidth = 101;
	this.renderHeight = 101;

	// Margins for placements of pulleys
	this.marginVert = 10;// pixels
	this.marginHorz = 10;// pixels

	this.lineWidth = 1;// pixels
	this.lineColor = 'black';

	this.pulleyRadius = 4;// pixels
	this.pulleyColor = 'grey';

	this.weightSideLength = 1;// side length of square weights on sides
	this.weightHangLength = 50;
	this.weightColor = 'rgba(60, 200, 60, 1)';

	// The weight in middle is called the bob
	this.bobSideLength = 20;
	this.bobHangLength = 30;// does not matter what value this gets
	this.bobColor = 'rgba(250, 240, 50, 1)';

	this.pulleyLength = 10;// meters
	this.centerMass = 1;// kilograms. of center block
	this.sideMass = 100;// kilograms. of a single side block

	// The scale of the system
	this.scale = 1;
}

Wequ._getPulleyDistance = function(wequ) {
	var left = Wequ.pulleys.LEFT.getCenter(wequ);
	var right = Wequ.pulleys.RIGHT.getCenter(wequ);

	return right.x - left.x;// pixels
};
Wequ.prototype.getPulleyDistance = function() {
	return Wequ._getPulleyDistance(this);
};

Wequ._getRopeDistance = function(wequ) {
	// Not perfectly accurate due to length of string drawn on pulleys
	// Perfectly accurate is not a concern because
	//  exact length of string drawn in graphics not needed
	return 3 * Wequ._getPulleyDistance(wequ);// pixels
};
Wequ.prototype.getRopeDistance = function() {
	return Wequ._getRopeDistance(this);
};

Wequ._metersToPixels = function(meters, wequ) {
	return (meters / wequ.pulleyLength) * wequ.getPulleyDistance();
};
Wequ.prototype.metersToPixels = function(meters) {
	return Wequ._metersToPixels(meters, this);
};

Wequ._pixelsToMeters = function(pixels, wequ) {
	return (pixels / wequ.getPulleyDistance()) * wequ.pulleyLength;
};
Wequ.prototype.pixelsToMeters = function(pixels) {
	return Wequ._pixelsToMeters(pixels, this);
};

Wequ._getBobHangLength = function(wequ) {
	var bobHang = (wequ.pulleyLength * wequ.centerMass * 0.5);

	bobHang *= Math.pow(4 * Math.pow(wequ.sideMass, 2) - Math.pow(wequ.centerMass, 2), -0.5);

	return bobHang;// meters
};
Wequ.prototype.getBobHangLength = function() {
	return Wequ._getBobHangLength(this);
};

Wequ._getHangLengths = function(wequ) {
	var bobHangMeters = wequ.getBobHangLength();

	var bobHangPixels = wequ.metersToPixels(bobHangMeters);

	var hyp = Math.pow( Math.pow(wequ.getPulleyDistance() / 2, 2) + Math.pow(bobHangPixels, 2), 0.5 );

	var sideHangPixels = (wequ.getRopeDistance() - (2 * hyp)) / 2;
	if (sideHangPixels < wequ.pulleyRadius) {
		sideHangPixels = wequ.pulleyRadius;
		// ^ This avoids the side blocks being pulled up above the pulleys.
		//    The bob's hang is still proportional to the distance between
		//    the pulleys. That is the important part. sideHang is calculated
		//    to make the string look real/make the string not
		//    grow or shrink in length.
		// ^ This can give the impression that the string stretches (it would
		//    not, the pulley system would break or fall apart),
		//    but this approach is less abrasive to the eye than the side blocks
		//    floating above the pulleys.
	}

	return {bob: bobHangPixels, side: sideHangPixels};
};
Wequ.prototype.getHangLengths = function() {
	return Wequ._getHangLengths(this);
};

Wequ._updateHangLengths = function(wequ) {
	var hangLengths = wequ.getHangLengths();

	wequ.weightHangLength = hangLengths.side;
	wequ.bobHangLength = hangLengths.bob;
};
Wequ.prototype.updateHangLengths = function() {
	Wequ._updateHangLengths(this);
};

// Draw pulley at (0, 0) based on wequ
Wequ._renderPulley = function(ctx, wequ) {
	ctx.save();
	ctx.beginPath();
	ctx.arc(0, 0, wequ.pulleyRadius, 0, 2 * Math.PI, false);

	ctx.fillStyle = wequ.pulleyColor;
	ctx.fill();

	ctx.lineWidth = wequ.lineWidth;
	ctx.strokeStyle = wequ.lineColor;
	ctx.stroke();

	ctx.closePath();
	ctx.restore();
};

Wequ.pulleys = {};
Wequ.pulleys.LEFT = {
	location: "LEFT",
	getCenter: function(wequ) {
		var x = wequ.marginHorz + wequ.pulleyRadius;
		var y = wequ.marginVert + wequ.pulleyRadius;

		return {x: x, y: y};
	}
};
Wequ.pulleys.RIGHT = {
	location: "RIGHT",
	getCenter: function(wequ) {
		var x = wequ.renderWidth - 1 - wequ.marginHorz - wequ.pulleyRadius;
		var y = wequ.marginVert + wequ.pulleyRadius;

		return {x: x, y: y};
	}
};

Wequ._drawPulley = function(ctx, wequ, pulley) {
	var center = pulley.getCenter(wequ);

	ctx.save();
	ctx.translate(center.x, center.y);

	Wequ._renderPulley(ctx, wequ);

	ctx.restore();
};

Wequ.prototype.drawPulley = function(ctx, pulley) {
	Wequ._drawPulley(ctx, this, pulley);
};

Wequ._renderWeight = function(ctx, wequ, sideLength, fillColor) {
	ctx.save();
	ctx.beginPath();
	ctx.rect(0, 0, sideLength, sideLength);

	ctx.fillStyle = fillColor;
	ctx.fill();

	ctx.lineWidth = wequ.lineWidth;
	ctx.strokeStyle = wequ.lineColor;
	ctx.stroke();

	ctx.closePath();
	ctx.restore();
};
Wequ.weights = {};
Wequ.weights.getColor = function(wequ) {
	return wequ.weightColor;
};
Wequ.weights.getSideLength = function(wequ) {
	return wequ.weightSideLength;
};
Wequ.weights.LEFT = {
	location: "LEFT",
	getOrigin: function(wequ) {
		var x = wequ.marginHorz - (this.getSideLength(wequ) / 2);
		var y = wequ.marginVert + wequ.pulleyRadius + wequ.weightHangLength;

		return {x: x, y: y};
	},
	getColor: Wequ.weights.getColor,
	getSideLength: Wequ.weights.getSideLength
};
Wequ.weights.RIGHT = {
	location: "RIGHT",
	getOrigin: function(wequ) {
		var x = wequ.renderWidth - 1 - wequ.marginHorz - (this.getSideLength(wequ) / 2);
		var y = wequ.marginVert + wequ.pulleyRadius + wequ.weightHangLength;

		return {x: x, y: y};
	},
	getColor: Wequ.weights.getColor,
	getSideLength: Wequ.weights.getSideLength
};
Wequ.weights.BOB = {
	location: "CENTER",
	getOrigin: function(wequ) {
		// Will be 1 pixel closer to left if
		//  wequ.renderWidth is not odd
		var x = Math.floor( (wequ.renderWidth - wequ.bobSideLength) / 2 );
		var y = wequ.marginVert + wequ.bobHangLength;

		return {x: x, y: y};
	},
	getColor: function(wequ) {
		return wequ.bobColor;
	},
	getSideLength: function(wequ) {
		return wequ.bobSideLength;
	}
};

Wequ._drawWeight = function(ctx, wequ, weight) {
	var origin = weight.getOrigin(wequ);
	var fillColor = weight.getColor(wequ);
	var sideLength = weight.getSideLength(wequ);

	ctx.save();
	ctx.translate(origin.x, origin.y);

	Wequ._renderWeight(ctx, wequ, sideLength, fillColor);

	ctx.restore();
};

Wequ.prototype.drawWeight = function(ctx, weight){
	Wequ._drawWeight(ctx, this, weight);
};

Wequ._renderConnector = function(ctx, wequ, start, end) {
	ctx.save();
	ctx.translate(start.x, start.y);
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.translate(end.x - start.x, end.y - start.y);
	ctx.lineTo(0, 0);

	ctx.strokeStyle = wequ.lineColor;
	ctx.lineWidth = wequ.lineWidth;
	ctx.stroke();

	ctx.closePath();
	ctx.restore();
};
Wequ.connectors = {};
Wequ.connectors.getEndLinear = function(wequ) {
	var end = this.getStart(wequ);

	end.y += wequ.weightHangLength;

	return end;
};
Wequ.connectors.getEndCenter = function(wequ) {
	var end = Wequ.weights.BOB.getOrigin(wequ);
	end.x += wequ.bobSideLength / 2;

	return end;
};
Wequ.connectors.LEFT = {
	location: "LEFT",
	getStart: function(wequ) {
		var pulley = Wequ.pulleys.LEFT;

		var start = pulley.getCenter(wequ);
		start.x -= wequ.pulleyRadius;

		return start;
	},
	getEnd: Wequ.connectors.getEndLinear
};
Wequ.connectors.RIGHT = {
	location: "RIGHT",
	getStart: function(wequ) {
		var pulley = Wequ.pulleys.RIGHT;

		var start = pulley.getCenter(wequ);
		start.x += wequ.pulleyRadius;

		return start;
	},
	getEnd: Wequ.connectors.getEndLinear
};
Wequ.connectors.CENTER_LEFT = {
	location: "CENTER_LEFT",
	getStart: function(wequ) {
		var pulley = Wequ.pulleys.LEFT;

		var start = pulley.getCenter(wequ);
		var end = this.getEnd(wequ);

		var dx = end.x - start.x;
		var dy = end.y - start.y - wequ.pulleyRadius;
		var angle = Math.atan(dy / dx);

		start.x += wequ.pulleyRadius * Math.sin(angle);
		start.y -= wequ.pulleyRadius * Math.cos(angle);

		return start;
	},
	getEnd: Wequ.connectors.getEndCenter
};
Wequ.connectors.CENTER_RIGHT = {
	location: "CENTER_RIGHT",
	getStart: function(wequ) {
		var pulley = Wequ.pulleys.RIGHT;

		var start = pulley.getCenter(wequ);
		var end = this.getEnd(wequ);

		var dx = end.x - start.x;
		var dy = end.y - start.y - wequ.pulleyRadius;
		var angle = Math.atan(dy / dx);

		start.x += wequ.pulleyRadius * Math.sin(angle);
		start.y -= wequ.pulleyRadius * Math.cos(angle);

		return start;
	},
	getEnd: Wequ.connectors.getEndCenter
};

Wequ._drawConnector = function(ctx, wequ, connector) {
	var start = connector.getStart(wequ);
	var end = connector.getEnd(wequ);

	Wequ._renderConnector(ctx, wequ, start, end);
};

Wequ.prototype.drawConnector = function(ctx, connector) {
	Wequ._drawConnector(ctx, this, connector);
};

Wequ._draw = function(ctx, wequ) {
	// console.log("draw");
	ctx.save();
	ctx.scale(wequ.scale, wequ.scale);

	wequ.drawPulley(ctx, Wequ.pulleys.LEFT);
	wequ.drawPulley(ctx, Wequ.pulleys.RIGHT);

	wequ.drawWeight(ctx, Wequ.weights.LEFT);
	wequ.drawWeight(ctx, Wequ.weights.RIGHT);
	wequ.drawWeight(ctx, Wequ.weights.BOB);

	wequ.drawConnector(ctx, Wequ.connectors.LEFT);
	wequ.drawConnector(ctx, Wequ.connectors.RIGHT);
	wequ.drawConnector(ctx, Wequ.connectors.CENTER_LEFT);
	wequ.drawConnector(ctx, Wequ.connectors.CENTER_RIGHT);

	ctx.restore();
};

Wequ.prototype.draw = function(ctx) {
	Wequ._draw(ctx, this);
};
