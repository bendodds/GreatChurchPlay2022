(function() {
    function audioCtx() {
        var audioCtx = (window.AudioContext || window.webkitAudioContext ||
            window.mozAudioContext || window.oAudioContext ||
            window.msAudioContext);
        if (audioCtx) {
            return new audioCtx();
        } else {
            alert(
                'Web Audio not supported in this browser. Please use a modern browser such as Chrome or Firefox'
            );
            return;
        }
    };

    function Filter(ctx, type, frequency, gain, q) {
        var filter = ctx.createBiquadFilter();
        filter.type = type;
        filter.frequency.value = frequency;
        if (gain) {
            filter.gain.value = gain;
        }
        if (q) {
            filter.Q.value = q;
        }
        return filter;
    };

    function Button(channel, className, text, label) {
        if (!label) label = '';
        if (!text) text = '';
        var button = $('<div class="button-container ' + className +
            '">' + label + '<div class="button-control">' + text +
            '</div></div>');
        channel.append(button);
        button.on('click', function() {
            var channelNo = $(this).parents('.channel').index();
            $(this).trigger('focused', channelNo);
        });
        return button;
    };

    function Fader(channel, count, className) {
        var fader = $('<div class="fader-container ' + className +
            '"><div class="channel-notches"><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch zeroed">0</div><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch"></div><div class="channel-notch"></div></div><div class="fader-no">' +
            count +
            '</div><div class="fader-track"><div class="fader"><div></div></div></div></div>'
        );
        channel.append(fader);
        $(fader).find('.fader').on('mousedown', function(e) {
            var el = $(this),
                pos = e.pageY,
                offset = el.position().top;
            $(document).mousemove(function(evt) {
                var move = (evt.pageY - pos);
                var top = (move + offset);
                if ((top >= -35) && (top <= 260)) {
                    el.css('top', (move + offset) +
                        'px');
                    //plus 35 so we have a positive range to deal with - by default the range is -35 to 250
                    el.trigger('fader', (move + offset +
                        35));
                }
            });
            $(document).on('mouseup', function() {
                $(document).off('mousemove');
            });
        });
        $(fader).find('.fader').on('dblclick', function() {
            $(this).css({
                "top": '30px'
            });
            $(this).trigger('fader', (0 + 35 + $(this).position()
                .top));
        });
        return fader;
    };

    /* I need better trigonometry */
    function RotaryKnob(channel, label, className) {
        var knobTemplate = $(rotaryKnobTemplate);
        if (className) {
            knobTemplate.find('.dial').addClass(className);
        }
        //channel.append(knobTemplate);
        var notches = $(knobTemplate).find('.notches');
        $(knobTemplate).prepend('<p>' + label + '</p>');
        var degree = 0;
        for (var i = 0; i < 15; ++i) {
            if (i > 9 || i < 6) {
                if (i == 0) {
                    var minute = $('<div class="minutes zero"></div>');
                } else {
                    var minute = $('<div class="minutes"></div>');
                }
                minute.css('-webkit-transform', 'rotate(' + degree +
                    'deg)');
                notches.append(minute);
            }
            degree = degree + 24;
        }
        $(knobTemplate).find('.dial').on('mousedown', function(e) {
            var el = $(this),
                offset = el.offset(),
                center_x,
                center_y,
                mouse_x,
                radians,
                degree,
                degreeRatio;
            $(document).mousemove(function(evt) {
                center_x = (offset.left) + (el.width() /
                    2);
                center_y = (offset.top) + (el.height() /
                    2);
                mouse_x = evt.pageX;
                var mouse_y = evt.pageY;
                radians = Math.atan2(mouse_x - center_x,
                    mouse_y - center_y);
                degree = (radians * (180 / Math.PI) * -
                    1);
                if (degree < 0) {
                    degree = degree + 360;
                }
                if (degree >= 50 && degree <= 310) {
                    el.css('-moz-transform', 'rotate(' +
                        degree + 'deg)');
                    el.css('-webkit-transform',
                        'rotate(' + degree + 'deg)'
                    );
                    degreeRatio = ((degree - 180) / 4);
                    el.trigger('change', degreeRatio);
                }
            });
            $(document).on('mouseup', function() {
                $(document).off('mousemove');
            });
        });
        $(knobTemplate).find('.dial').on('dblclick', function() {
            $(this).css({
                "-webkit-transform": 'rotate(180deg)'
            });
            $(this).trigger('change', 0)
        });
        return knobTemplate;
    };

    function Timer(duration) {
        this.offset;
        this.clock = 0;
        this.interval = 0;
        this.duration = duration;
    };

    Timer.prototype.start = function() {
        if (!this.interval) {
            this.offset = Date.now();
            this.interval = setInterval(this.update.bind(this), 1);
        }
    };

    Timer.prototype.stop = function() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    };

    Timer.prototype.reset = function() {
        this.clock = 0;
        this.render();
    };

    Timer.prototype.update = function() {
        this.clock += this.delta();
        if(this.clock > this.duration) {
            $('#pause').click();
            $('#restart').click();
        }
        this.render();
    };

    Timer.prototype.render = function() {
        var curr = new Date(this.clock);
        var secs = this.pad(curr.getSeconds());
        var millis = this.pad(((curr.getMilliseconds() / 10) % 100).toFixed());
        var mins = this.pad(curr.getMinutes());
        $('#time-milli').text(millis);
        $('#time-min').text(mins);
        $('#time-secs').text(secs);
    };

    Timer.prototype.pad = function(num) {
        if (num < 10) {
            return '0' + num.toString();
        }
        return num;
    };

    Timer.prototype.delta = function() {
        var now = Date.now(),
            d = now - this.offset;
        this.offset = now;
        return d;
    };

    Timer.prototype.advance = function(milliseconds) {
        this.clock += milliseconds;
        this.clock = Math.max(this.clock, 0);
        this.clock = Math.min(this.clock, this.duration)
        this.render();
    }

    function FetchAudioFile(sourceName, ctx) {
        return new Promise((resolve, reject) => {
            fetch('audio/' + sourceName)
                .then((response) => response.arrayBuffer())
                .then((buffer) => ctx.decodeAudioData(buffer))
                .then((decodedAudio) => resolve(
                    {"name": sourceName, "buffer": decodedAudio}
                ))
        });
    };

    function Daw(sources) {
        var self = this;
        this.sources = sources.slice(0);
        this.ctx = audioCtx();
        this.tracks = [];

        this.populateLoader();
        var promises = [];
        for (var i = 0; i < this.sources.length; i++) {
            promises.push(FetchAudioFile(this.sources[i], this.ctx));
        }

        var tracks = []
        self.updateLoader(1);
        for (var i = 0; i < promises.length; i++) {
            Promise.resolve(promises[i]).then((track) => {
                tracks.push(track);
                self.updateLoader(tracks.length);
            });
        }

        Promise.all(promises).then(() => {
            this.tracks = tracks;
            this.mixer = new Mixer(this.ctx, this.tracks);
            this.hideLoader();
            this.showMixer();
            $('#pause').click();
            this.initHints();
        });
    };

    Daw.prototype.showMixer = function() {
        $('#mixer').show();
    };

    Daw.prototype.hideLoader = function() {
        $('#loader').hide();
    };

    Daw.prototype.populateLoader = function(current) {
        $('#loader span.total').text(this.sources.length);
        $('#loader').show();
    };

    Daw.prototype.updateLoader = function(current) {
        $('#loader span.current').text(current);
    };

    Daw.prototype.initHints = function() {
        var hintsClone = $('#hints').clone();
        $('#mixer').prepend(hintsClone).show();
        hintsClone.show();
        hintsClone.find('li').hover(function() {
            $(this).find('div').show();
        }, function() {
            $(this).find('div').hide();
        });
    };

    function Mixer(ctx, tracks) {
        var track,
            trackName,
            trackBuffer,
            count = 0,
            rawBuffer;
        this.soloed = 0;
        this.channels = [];
        this.el = $('#mixer');
        this.ctx = ctx;
        this.duration = 0;
        this.tracks = tracks;
        self.playingBack = false;
        this.createMasterChannel();
        for (var i = 0; i < tracks.length; ++i) {
            var buffSource;
            track = tracks[i];
            rawBuffer = track.buffer;
            trackName = track.name;
            buffSource = this.createBufferSource(rawBuffer);
            this.updateDuration(buffSource.buffer.duration * 1000, trackName);
            this.channels.push(new Channel(rawBuffer, buffSource,
                trackName, this, ctx, i));
        }
        this.createTransport();
    };

    Mixer.prototype.createBufferSource = function(buffer) {
        var buff = this.ctx.createBufferSource();
        buff.buffer = buffer;
        return buff;
    };

    Mixer.prototype.createBuffers = function(p) {
        for (var i = 0; i < this.channels.length; ++i) {
            this.channels[i].track = this.createBufferSource(this.channels[
                i].rawBuffer);
        }
    };

    Mixer.prototype.clearBuffers = function(playing) {
        for (var i = 0; i < this.channels.length; ++i) {
            if (playing && this.channels[i].track) {
                try {
                    this.channels[i].track.stop(0);
                }
                catch(err) {
                }
            }
            this.channels[i].track = null;
        }
    };

    Mixer.prototype.createTransport = function() {
        var self = this;
        this.elapsed = 0;
        this.offset = 0;
        this.start = 0;
        this.timer = new Timer(self.duration);
        $('#transport_container').append(
            '<div id="transport"><h1>Prolog</h1><div id="display"><div id="time-min">00</div><span>:</span><div id="time-secs">00</div><span>:</span><div id="time-milli">00</div><div class="clear"></div></div><div class="controls"><button id="play">&#9658;</button><button id="pause">||</button><button id="restart">&#8634</button><button id="back30">&lt; 30s</button><button id="back10">&lt; 10s</button><button id="forward10">10s &gt;</button><button id="forward30">30s &gt; </button></div></div>'
        );
        $('#play').on('click', function() {
            var el = $(this);
            $('#transport .controls button').removeClass('on');
            el.addClass('on');
            if (self.elapsed >= self.duration) {
                self.offset = self.start = self.elapsed = 0;
                el.removeClass('on');
            }
            if (!self.playingBack) {
                self.createBuffers();
                self.playingBack = true;
                self.playing = setInterval(function() {
                    self.elapsed += 100;
                    if (self.elapsed >= self.duration) {
                        el.removeClass('on');
                        self.playingBack = false;
                        self.clearBuffers(true);
                        clearInterval(self.playing);
                        self.offset = self.start = self.elapsed = 0;
                    }
                }, 100);
                self.start = self.ctx.currentTime;
                self.timer.start();
                for (var i = 0; i < self.channels.length; ++i) {
                    self.channels[i].connect();
                    self.channels[i].track.start(0, self.offset);
                }
            }
        });
        $('#pause').on('click', function() {
            self.timer.stop();
            $('#transport .controls button').removeClass('on');
            $(this).addClass('on');
            self.playingBack = false;
            self.clearBuffers(true);
            clearInterval(self.playing);
            self.offset += self.ctx.currentTime - self.start;
        });
        $('#restart').on('click', function() {
            let wasPlaying = self.playingBack;

            self.timer.stop();
            self.playingBack = false;
            self.clearBuffers(true);
            clearInterval(self.playing);

            self.offset = 0;
            self.start = 0;
            self.elapsed = 0;
            self.timer.reset();

            if(wasPlaying) {
                $('#play').click();
            }
        });
        $('#back30').on('click', function() {
            let wasPlaying = self.playingBack;

            self.timer.stop();
            self.playingBack = false;
            self.clearBuffers(wasPlaying);
            clearInterval(self.playing);

            self.offset = Math.max(self.offset - 30, 0);
            self.start = self.offset * 1000;
            self.elapsed = self.offset * 1000;
            self.timer.advance(-30000);

            if(wasPlaying) {
                $('#play').click();
            }
        });
        $('#forward30').on('click', function() {
            let wasPlaying = self.playingBack;

            self.timer.stop();
            self.playingBack = false;
            self.clearBuffers(wasPlaying);
            clearInterval(self.playing);

            self.offset = Math.min(self.offset + 30, self.duration);
            self.start = self.offset * 1000;
            self.elapsed = self.offset * 1000;
            self.timer.advance(30000);

            if(wasPlaying) {
                $('#play').click();
            }
        });
        $('#back10').on('click', function() {
            let wasPlaying = self.playingBack;

            self.timer.stop();
            self.playingBack = false;
            self.clearBuffers(wasPlaying);
            clearInterval(self.playing);

            self.offset = Math.max(self.offset - 10, 0);
            self.start = self.offset * 1000;
            self.elapsed = self.offset * 1000;
            self.timer.advance(-10000);

            if(wasPlaying) {
                $('#play').click();
            }
        });
        $('#forward10').on('click', function() {
            let wasPlaying = self.playingBack;

            self.timer.stop();
            self.playingBack = false;
            self.clearBuffers(wasPlaying);
            clearInterval(self.playing);

            self.offset = Math.min(self.offset + 10, self.duration);
            self.start = self.offset * 1000;
            self.elapsed = self.offset * 1000;
            self.timer.advance(10000);

            if(wasPlaying) {
                $('#play').click();
            }
        });
    };

    Mixer.prototype.updateDuration = function(duration, t) {
        if (duration > this.duration) this.duration = duration;
    };

    Mixer.prototype.createMasterChannel = function() {
        var masterChannel = $(channelTemplate),
            masterFader = new Fader(masterChannel, '&nbsp;', 'master'),
            oldMin = 285,
            oldMax = 0,
            newMin = 0,
            newMax = 1.3,
            newVol,
            self = this;
        masterChannel.addClass('master-channel');
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 1;
        this.el.append(masterChannel);
        masterFader.on('fader', function(e, val) {
            newVol = ((val - oldMin) / (newMin - oldMin)) * (
                newMax - newMin) + newMin;
            self.masterGain.gain.value = newVol;
        });
    };

    function Channel(rawBuffer, track, trackName, mixer, ctx, count) {
        this.count = count;
        this.mixer = mixer;
        this.currGain = 1;
        this.el = $(channelTemplate);
        this.track = track;
        this.rawBuffer = rawBuffer;
        this.ctx = ctx;
        this.on = true;
        this.soloed = false;
        this.trackName = trackName;
        this.createChannelFilters(this.el, track, ctx);
        this.createChannelPanner(this.el, track, ctx);
        this.createChannelFader(this.el, track, ctx);
        this.connect();
        this.createChannelControls();
        this.createChannelLabel();
        this.el.insertBefore(this.mixer.el.find('.master-channel'));
    };

    Channel.prototype.createChannelLabel = function() {
        var trackName = this.trackName.replace('.mp3', '').replace(/_/g,
            ' ').replace(/\w+\//g, '');
        this.el.find('.fader-container').prepend('<p class="label">' +
            trackName + '</p>');
    };

    Channel.prototype.enableDisableChannels = function() {
        var i;
        for (i = 0; i < this.mixer.channels.length; ++i) {
            if (!this.mixer.channels[i].on) {
                this.mixer.channels[i].gain.gain.value = 0;
            } else if (this.mixer.channels[i].on) {
                if (this.mixer.soloed === 0) {
                    this.mixer.channels[i].gain.gain.value = this.mixer
                        .channels[i].currGain;
                } else if (this.mixer.soloed > 0 && this.mixer.channels[
                        i].soloed) {
                    this.mixer.channels[i].gain.gain.value = this.mixer
                        .channels[i].currGain;
                } else {
                    this.mixer.channels[i].gain.gain.value = 0;
                }
            }
        }
    };

    //break event listeners out in to seperate method
    Channel.prototype.createChannelControls = function() {
        var self = this;
        this.highShelfControl = new RotaryKnob(this.el, 'HIGH');
        this.highShelfControl.on('change', function(e, val) {
            self.highShelfFilter.gain.value = val;
        });
        this.midControl = new RotaryKnob(this.el, 'MID', 'mid');
        this.midControl.on('change', function(e, val) {
            self.midFilter.gain.value = val;
        });
        this.midFrequencyControl = new RotaryKnob(this.el, 'MID', 'mid');
        this.midFrequencyControl.on('change', function(e, val) {
            //a little hack to get rotary to output frequency between 100hz-10khz
            var pos = val + 32;
            var value = pos < 30 ? pos * 100 : pos * 160;
            if (value < 100) value = 100;
            self.midFilter.frequency.value = value;
        });
        this.lowShelfControl = new RotaryKnob(this.el, 'LOW');
        this.lowShelfControl.on('change', function(e, val) {
            self.lowShelfFilter.gain.value = val;
        });
        this.pannerControl = new RotaryKnob(this.el, 'PAN', 'panner');
        this.pannerControl.on('change', function(e, val) {
            self.panner.pan.value = val / 31;
        });
        this.soloControl = new Button(this.el, 'solo', undefined,
            'SOLO');
        this.soloControl.on('focused', function(e, val) {
            if ($(this).hasClass('on')) {
                self.mixer.soloed--;
                $(this).removeClass('on');
                self.soloed = false;
            } else {
                self.soloed = true;
                $(this).addClass('on');
                self.mixer.soloed++;
            }
            self.enableDisableChannels();
        });
        this.muteControl = new Button(this.el, 'mute', 'ON');
        this.muteControl.on('focused', function(e, val) {
            if ($(this).hasClass('off')) {
                $(this).removeClass('off');
                self.on = true;
            } else {
                $(this).addClass('off');
                self.on = false;
            }
            self.enableDisableChannels();
        });
        this.faderControl = new Fader(this.el, this.count);
        this.faderControl.on('fader', function(e, val) {
            var oldMin = 295,
                oldMax = 0,
                newMin = 0,
                newMax = 1.3;
            var newVol = ((val - oldMin) / (newMin - oldMin)) *
                (newMax - newMin) + newMin;
            self.currGain = newVol;
            self.enableDisableChannels();
        });
    };

    Channel.prototype.connect = function() {
        this.track.connect(this.highPassFilter);
        this.highPassFilter.connect(this.lowShelfFilter)
        this.lowShelfFilter.connect(this.highShelfFilter)
        this.highShelfFilter.connect(this.midFilter);
        this.midFilter.connect(this.panner)
        this.panner.connect(this.gain)
        this.gain.connect(this.mixer.masterGain)
        this.mixer.masterGain.connect(this.ctx.destination)
    };

    Channel.prototype.createChannelPanner = function(channel, track, ctx) {
        this.panner = this.ctx.createStereoPanner();
        this.panner.pan.value = 0;
    };

    Channel.prototype.createChannelFader = function(channel, track, ctx) {
        this.gain = this.ctx.createGain();
        this.gain.gain.value = 1.0;
    };

    Channel.prototype.createChannelFilters = function(channel, track, ctx) {
        this.highPassFilter = Filter(this.ctx, 'highpass', 80, 0);
        this.lowShelfFilter = Filter(this.ctx, 'lowshelf', 90, 0);
        this.highShelfFilter = Filter(this.ctx, 'highshelf',
            10000, 0);
        this.midFilter = Filter(this.ctx, 'peaking', 10000, 0);
    };

    $("#songselect").change(function () {
        let songName = $(this).find('option:selected').val();
        if(songName == "--Please choose an option--") {
            return;
        }

        tracks = tracksBySongName[songName];

        $('#pause').click();
        $('#transport_container').empty();
        $('#mixer').empty();
        new Daw(tracks);

        $('#songselect').blur();
    });

    //These sources could eventually be loaded from the server
    var tracksBySongName = {
        "prolog": [
            "prolog/Instrumental.mp3",
            "prolog/Narrator.mp3",
            "prolog/All.mp3",
            "prolog/Angel.mp3",
            "prolog/Elah.mp3",
            "prolog/Florinda.mp3",
            "prolog/Jack's Mother.mp3",
            "prolog/Jack.mp3",
            "prolog/Joseph.mp3",
            "prolog/Lucinda.mp3",
            "prolog/Mary.mp3",
            "prolog/Redna's Mother.mp3",
            "prolog/Redna.mp3",
            "prolog/Stepmother.mp3",
            "prolog/Vendor 1.mp3",
            "prolog/Vendor 2.mp3",
        ],
        "yourfault": [
            "yourfault/All.mp3",
            "yourfault/Angel - Angela.mp3",
            "yourfault/Angel - Grace.mp3",
            "yourfault/Angel -Jazna.mp3",
            "yourfault/Balthazar.mp3",
            "yourfault/Elah.mp3",
            "yourfault/Gaspar.mp3",
            "yourfault/Instrumental.mp3",
            "yourfault/Jack.mp3",
            "yourfault/Melchior.mp3",
            "yourfault/Raziel.mp3",
            "yourfault/Redna.mp3",
        ]
    };

    var channelTemplate = '<div class="channel"></div>';
    var rotaryKnobTemplate = '<div class="dial-container"><div class="notches"></div><div class="dial"><div class="dial-inner"></div></div></div>';
})();
