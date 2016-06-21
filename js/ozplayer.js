(function( $ ) {

	var length=0;
	var current=0;
	var video;
	var vidHeight;
	var isWaiting = false;
	var btnOnVideo;
	var controls;
	var bar,thumb,barContainer;
	var askBtn;
	var onSeekHover = false;
	var onSeekMouseDown = false;
	var playBtn;
	var volumeBg,volumeThumb,volIcon;
	var onVolumeMouseDown;
	var fscreen;
	var isFscreen = false;
	var isLoaded = false;
	//var longBar = false;
	var settings;
	var lastFiredSecond = 0;


	var ctrHTML = "\
	<div id='controls'>\
	<button id='play-btn' class='btn btn-default'><i class='fa fa-play' aria-hidden='true'></i></button>\
	<div id='bar-container'>\
	<div id='bar-bg'><div id='bar-thumb'></div></div>\
	</div>\
	<div id='timeLabel'>\
	<span id='current'>00:00 / </span>\
	<span id='length'>00:00</span>\
	</div>\
	<button id='ask' class='btn btn-default' disabled='disabled'><i class='fa fa-plus' aria-hidden='true'></i> <i class='fa fa-question-circle' aria-hidden='true'></i></button>\
	<button id='fscreen' class='btn btn-default'><i class='fa fa-expand' aria-hidden='true'></i></button>\
	<div id='volume-bg'><div id='volumeThumb'></div></div>\
	<span id='volume-icon' class='fa fa-volume-up'></span>\
	</div>\
	";

	var btnOnVideoHTML = "<button class='btn btn-lg' id='btnOnVideo'><i class='fa fa-play' aria-hidden='true'></i></button>";

	var qElem = "<div class='pin'><i class='fa fa-question-circle qmark' aria-hidden='true'></i></div>";


	function drawMarks(){
		if(isLoaded && !isFscreen){
			for(var i=0; i<settings.timeMarks.length; i++){
				var obj = $.parseHTML(qElem);
				barContainer.append(obj);
				var pin = barContainer.find('.pin').last();

				var startX = bar.position().left;
				var w = barContainer.width();
				var _left = w * (settings.timeMarks[i]/length) + startX;
				_left -= pin.width()/2;

				/*bar.position().top - pin.outerHeight() - bar.height()*/

				if(settings.isLongBar){
					//var _top = $('video').position().top + $('video').height() - pin.height() - bar.outerHeight(true);
					var _top = barContainer.position().top - pin.outerHeight(true) - 6;
				}else{
					var _top = controls.position().top + controls.outerHeight(true) / 2 - pin.outerHeight(true) - bar.height();
				}

				pin.css({
					'top': _top + 'px',
					'left': _left + 'px'
				});

				pin.attr('data-sec',settings.timeMarks[i]);
			}
		}
	}

	function checkSecond(){
		$( ".pin" ).each(function( index ) {
			var sec = Math.floor(current);
			var dataSec = Math.floor($(this).data('sec'));

			if(sec == dataSec){
				$(this).addClass('highlight');
				if(lastFiredSecond != sec){
					$(video).trigger('onMark', [sec]);
					lastFiredSecond = sec;
				}
			}else{
				$(this).removeClass('highlight');
			}
		});
	}

	function printTime(){

		var c = Math.floor(current);
		var l = Math.floor(length);

		var _c_m = (Math.floor(c/60));
		var _c_s = (Math.floor(c%60));

		if(_c_m < 10) _c_m = "0" + _c_m;
		if(_c_s < 10) _c_s = "0" + _c_s;

		var _l_m = (Math.floor(l/60));
		var _l_s = (Math.floor(l%60));

		if(_l_m < 10) _l_m = "0" + _l_m;
		if(_l_s < 10) _l_s = "0" + _l_s;

		$('#current').text(_c_m + ":" + _c_s + " / ");
		$('#length').text(_l_m + ":" + _l_s);
	}

	function calcProgress(){
		var bgW = bar.outerWidth();
		var currentW = bgW * (current/length);
		if(current == 0 || length == 0)
			currentW = 0;
		if(!onSeekHover)
			thumb.width(currentW);

		if(isLoaded){
			printTime();
		}

	}

	function seek(_to){
		if(_to == null)
			var time = length * (thumb.width()/bar.width());
		else
			time = _to;
		video.currentTime = time;
		$(video).trigger('onseek', [time]);
		//console.log('seeked')
	}

	function setVolume(){
		video.muted = false;
		setVolIcon();
		var vol = (volumeThumb.offset().left - volumeBg.offset().left) / 100;
		vol = (vol < 0) ? 0 : vol;
		vol = (vol > 1) ? 1 : vol;
		video.volume = vol;
		if(video.volume == 0){
			volIcon.removeClass('fa-volume-up').addClass('fa-volume-off');
		}else{
			volIcon.removeClass('fa-volume-off').addClass('fa-volume-up');
		}
	}

	function togglePlay(){
		if(video.paused){
			oz_play();
		}
		else{
			oz_pause();
		}
	}

	function oz_pause(){
		video.pause();
		playBtn.find('i').removeClass('fa-pause').addClass('fa-play');
		btnOnVideo.show().find('i').removeClass('fa-play fa-circle-o-notch spinner').addClass('fa-pause');
	}

	function oz_play(){
		video.play();
		playBtn.find('i').removeClass('fa-play').addClass('fa-pause');
		btnOnVideo.hide();
	}

	function toggleMute(){
		video.muted = !video.muted;
		setVolIcon();
	}

	function setVolIcon(isMuted){
		if(video.muted){
			if(isFscreen)
				volIcon.addClass('volume-muted-fscreen').removeClass('volume-normal-fscreen').removeClass('volume-normal').removeClass('volume-muted');
			else
				volIcon.addClass('volume-muted').removeClass('volume-normal-fscreen').removeClass('volume-normal').removeClass('volume-muted-fscreen');
		}else{
			if(isFscreen)
				volIcon.addClass('volume-normal-fscreen').removeClass('volume-muted-fscreen').removeClass('volume-muted').removeClass('volume-normal');
			else
				volIcon.addClass('volume-normal').removeClass('volume-muted-fscreen').removeClass('volume-muted').removeClass('volume-normal-fscreen');
		}
	}

	function calcElements(){
		if(!isFscreen){
			var fullWidth = $('.section-box').width();
		}
		else{
			var fullWidth = $(window).width();
		}

		if(!settings.isLongBar){
			var ctrWidth = playBtn.outerWidth(true) + volumeBg.outerWidth(true) + $('#timeLabel').outerWidth(true) +
			$('#volume-icon').outerWidth(true) + fscreen.outerWidth(true) + askBtn.outerWidth(true);

			ctrWidth -= (isFscreen) ?  askBtn.outerWidth(true) : 0;

			bar.width(fullWidth - ctrWidth - 10);
			barContainer.css('margin-top','0');
		}else{
			bar.width(fullWidth);
			bar.css({
				'margin-top':'-5px'
			});
			if(!isFscreen){
				$('video').after(barContainer);
				controls.css('height','');
			}else{
				controls.children().first().before(barContainer);
				controls.height(61);
			}
		}

		btnOnVideo.css({
			'left' : $(video).offset().left + $(video).width() / 2 - btnOnVideo.outerWidth(true) / 2,
			'top' : $(video).offset().top + $(video).height() / 2 - btnOnVideo.outerHeight(true) / 2
		});

	}
	

function openFscreen(){
	if (!document.fullscreenElement &&    // alternative standard method
	!document.mozFullScreenElement && !document.webkitFullscreenElement && !document.msFullscreenElement ) {  // current working methods
		var cont = document.getElementById("video-container");
		if (cont.requestFullscreen) {
			//video.requestFullscreen();
			cont.requestFullscreen();
		} else if (cont.msRequestFullscreen) {
			//video.msRequestFullscreen();
			cont.msRequestFullscreen();
		} else if (cont.mozRequestFullScreen) {
			//video.mozRequestFullScreen();
			cont.mozRequestFullScreen();
		} else if (cont.webkitRequestFullscreen) {
			//video.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
			cont.webkitRequestFullscreen(Element.ALLOW_KEYBOARD_INPUT);
		}

		controls.addClass('fscreen-controls');
		fscreen.find('i').removeClass('fa-expand').addClass('fa-compress');
		$(video).css('max-height','');

		isFscreen = true;

		askBtn.toggle();
		setVolIcon();
		calcElements();
		calcProgress();
	}
}

function exitFscreen(){
	if (document.exitFullscreen) {
		document.exitFullscreen();
	} else if (document.msExitFullscreen) {
		document.msExitFullscreen();
	} else if (document.mozCancelFullScreen) {
		document.mozCancelFullScreen();
	} else if (document.webkitExitFullscreen) {
		document.webkitExitFullscreen();
	}

	controls.removeClass('fscreen-controls');
	fscreen.find('i').removeClass('fa-compress').addClass('fa-expand');
	$(video).css('max-height',vidHeight + 'px');
	bar.css('width','100%');

	isFscreen = false;

	askBtn.toggle();
	setVolIcon();
	calcElements();
	calcProgress();
}



function toggleFullScreen() {
	if(!isFscreen){
		openFscreen();
	} else {
		exitFscreen();
	}
}


function loadPlayer(){

	bar = $('#bar-bg');
	barContainer = $('#bar-container');
	thumb = $('#bar-thumb');
	playBtn = $('#play-btn');
	volumeBg = $('#volume-bg');
	volumeThumb = $('#volumeThumb');
	fscreen = $('#fscreen');
	controls = $('#controls');
	askBtn = $('#ask');
	volIcon = $('#volume-icon');

	//video = document.getElementById("oz_video");
	video.addEventListener('loadedmetadata', function() {
		length = video.duration;
		isLoaded = true;
		drawMarks();
	});

	video.addEventListener('ended', function() {
		playBtn.find('i').removeClass('fa-pause').addClass('fa-play');
		$(video).trigger('video_ended');
	});

	playBtn.click(function(){
		togglePlay();
	});

	$(video).click(function(){
		togglePlay();
	});

	$(video).dblclick(function(){
		toggleFullScreen();
	});


	$(video).on("timeupdate", function(event){
		current = this.currentTime;
    	//onTrackedVideoFrame(this.currentTime, this.duration);
    	calcProgress();
    	calcElements();
    	checkSecond();
    });

	video.addEventListener('waiting', function(event) {
		isWaiting = true;
		if(!video.paused)
			btnOnVideo.show().find('i').removeClass('fa-play').addClass('fa-circle-o-notch spinner');
	});

	video.addEventListener('canplay', function(event) {
		//console.log('playing triggered!');
		$('#ask').removeAttr('disabled');
		if(!video.paused)
			btnOnVideo.hide();
		else
			btnOnVideo.find('i').removeClass('fa-circle-o-notch spinner').addClass('fa-play');
		isWaiting = false;
	});

	$(video).on('seeked',function(){
		if(!video.paused)
			btnOnVideo.hide();
		else
			btnOnVideo.find('i').removeClass('fa-circle-o-notch spinner').addClass('fa-play');
	})

	btnOnVideo.click(function(){
		if(!isWaiting){
			togglePlay();
		}
	});

	bar.on('mousemove',function(event){
		var w = event.clientX - thumb.offset().left;
		thumb.width(w);
	});

	bar.on('mousedown',function(){
		onSeekMouseDown = true;
		seek();
	});


	bar.mouseenter(function(){
		onSeekHover = true;
		thumb.css('opacity','.3');
	});

	bar.mouseleave(function(){
		onSeekHover = false;
		thumb.css('opacity','1');
		calcProgress();
	});

	$(document).on('mousemove',function(event){
		if(onSeekMouseDown){
			var w = event.clientX - thumb.offset().left;

			w = (w > bar.width()) ? bar.width() : w;
			w = (w < 0) ? 0 : w;

			thumb.width(w);
			seek();
		}else if(onVolumeMouseDown){
			var x = event.clientX - volumeBg.offset().left;

			x = (x > 100) ? 100 : x;
			x = (x < 0) ? 0 : x;

			volumeThumb.css('margin-left',x);
			setVolume();
		}
	});

	$(document).on('mouseup',function(){
		onSeekMouseDown = false;
		onVolumeMouseDown = false;

	});

	$('#video-container').keyup(function checkESC(e){
		if(e.keyCode == 27 && isFscreen)
			exitFscreen();
	});


	volumeBg.on('mousedown',function(event){
		onVolumeMouseDown = true;

		var x = event.clientX - volumeBg.offset().left;

		x = (x > 100) ? 100 : x;
		x = (x < 0) ? 0 : x;

		volumeThumb.css('margin-left',x);

		setVolume();
	});

	fscreen.click(function(){
		toggleFullScreen();
	});

	$('body').delegate('.pin','click',function(){
		oz_pause();
		btnOnVideo.hide();
		var to = $(this).data('sec');
		seek(to);
		//checkSecond();
	});

	$('#ask').click(function(){
		oz_pause();
		btnOnVideo.hide();
		var formatted = $('#current').text().replace("\/","");
		$(video).trigger('addQuestionClick', [current,formatted]);
	});

	bar.bind('dragstart', function(event) { event.preventDefault(); });
	thumb.bind('dragstart', function(event) { event.preventDefault(); });
	$(document).bind('dragstart', function(event) { event.preventDefault(); });

	if(settings.isLongBar){
		controls.css('border-top-left-radius','0');
		controls.css('border-top-right-radius','0');
	}

	$('#volume-icon').click(function(){
		toggleMute();
	});

	setVolume();
	calcElements();


};

$(window).resize(function(){
	calcElements();
	calcProgress();
	$('.pin').remove();
	if(isLoaded)
		drawMarks();
});

$(window).load(function(){
	drawMarks();
	vidHeight = $(video).height();
	$(video).css('max-height',vidHeight + 'px');
});


$.fn.ozplayer = function(params){

	settings = $.extend({
            // default degerler.
            isLongBar : false,
            timeMarks : []
        }, params );


	$(this).attr('id','oz_video');
	video = this;
	video = document.getElementById("oz_video");
	//console.log(video);
	$(video).before("<div id='video-container'></div>");
	var elem = $(video).detach();
	$('#video-container').append(elem);
	$('#video-container').append(ctrHTML);
	$('#video-container').append(btnOnVideoHTML);
	btnOnVideo = $('#btnOnVideo');

	$.fn.ozplayer.gotoAndStop = function(to) {
		oz_play();
        seek(to);
        oz_pause();
        //console.log('seek to:' + to);
        btnOnVideo.hide();
    };

    $.fn.ozplayer.exitFullscreen = function() {
		exitFscreen();
    };

    $.fn.ozplayer.enterFullscreen = function() {
		openFscreen();
    };

	loadPlayer();
	return this;
}


}( jQuery ));