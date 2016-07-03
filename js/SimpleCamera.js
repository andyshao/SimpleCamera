/* =========================================================== *
 * @site http://tt-cc.cn
 * @email ttccmvp@gmail.com
 * Copyright 2016 ttcc
 * Licensed under the Apache License, Version 2.0 (the "License")
 * =========================================================== */
;
(function ($) {
    var defaults = {
        width: 280,//容器宽
        height: 320,//容器高
        photoW: 280,//图片宽
        photoH: 320,//图片高
        taketext: "拍照",//拍照按钮文字
        savetext: "保存",//保存按钮文字
        canceltext: "取消",
        inputStyle: "width:60px;border-radius:8px;cursor:pointer;border:none",//按钮样式
        doImage: "open",//为"open"时新窗口打开；如果是dom；则将图片append到此容器中；如果是url，则为上传至服务器地址
        onEnd: function (img) {
        }
    };
    $.fn.simpleCamera = function (method) {
        var args = arguments;
        return this.each(function () {
            var ui = $._data(this, "SimpleCamera");
            if (!ui) {
                var opts = $.extend({}, defaults, typeof method == 'object' && method);
                ui = new SimpleCamera(this, opts);
                $._data(this, "SimpleCamera", ui);
            }
            if (typeof method === "string" && typeof ui[method] == "function") {
                ui[method].apply(ui, Array.prototype.slice.call(args, 1));
            }
        });
    };
    var SimpleCamera = function (element, options) {
        this.ele = $(element);
        this.options = options;
        return "undefined" != typeof this.init && this.init.apply(this, arguments)
    };
    SimpleCamera.prototype = {
        init: function () {
            this.canvas = document.createElement("canvas");
            if (!this.canvas.getContext) {
                thorw(new Error(-1, "浏览器不支持HTML5!"))
                return;
            }
            this._initTemp();
            this._initCamera();
        },
        _initTemp: function () {
            var container = document.createElement("div");
            this.ele.append(container);
            container.className = "simple-camera-container";
            container.style.cssText = "position:relative;margin:o auto;width:" + this.options.width;
            var div = document.createElement("div");
            div.style.cssText = "position:relative;top:0;left:0;overflow:hidden;" +
                "width:" + this.options.width + "px;height:" + this.options.height + "px";
            container.appendChild(div);
            this.video = document.createElement("video");
            this.video.style.cssText = "display:block;";
            div.appendChild(this.video);
            this.canvas.style.cssText = "display:none;position:absolute;top:0;left:0;z-index:2";
            this.canvas.width = this.width = this.options.width;
            this.canvas.height = this.height = this.options.height;
            div.appendChild(this.canvas);
            this.result = document.createElement("div");
            this.result.style.cssText = "background: rgba(17, 17, 17,0.8);border: 1px solid;color: white;" +
                "width: 100px;display:none;z-index:4;position: absolute; left: " + (this.options.width / 2 - 50) + "px;" +
                "background: #111;padding: 5px 20px; border-radius: 6px;top:" + (this.options.height / 2 - 30) + "px";
            div.appendChild(this.result);
            var handle = document.createElement("div");
            handle.className = "simple-camera-handle";
            handle.style.cssText = "position:absolute;bottom:20px;z-index:3;padding-top:5px;text-align:center;width:" + this.options.width + "px";
            container.appendChild(handle);
            this.takeInput = document.createElement("button");
            this.takeInput.innerHTML = this.options.taketext;
            this.options.inputStyle && (this.takeInput.style.cssText = this.options.inputStyle);
            handle.appendChild(this.takeInput);
            this.saveInput = document.createElement("button");
            this.saveInput.innerHTML = this.options.savetext;
            this.options.inputStyle && (this.saveInput.style.cssText = this.options.inputStyle);
            this.saveInput.style.display = "none";
            handle.appendChild(this.saveInput);
            this.cancelInput = document.createElement("button");
            this.cancelInput.innerHTML = this.options.canceltext;
            this.options.inputStyle && (this.cancelInput.style.cssText = this.options.inputStyle);
            this.cancelInput.style.display = "none";
            handle.appendChild(this.cancelInput);
        },
        _initCamera: function () {
            var videoObj = {"video": true};
            var _this = this;
            navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;
            window.URL = window.URL || window.webkitURL || window.mozURL || window.msURL;
            if (navigator.getUserMedia) { // Standard
                navigator.getUserMedia(videoObj, function (stream) {
                    _this.video.mozSrcObject ? _this.video.mozSrcObject = stream :
                        _this.video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
                    _this.video.play();
                }, _this._errBack);
            } else {
                console.log("Native web camera streaming (getUserMedia) not supported in this browser");
                return;
            }
            $(this.takeInput).on("click", function () {
                _this.video.readyState == 4 && _this.takePhote();
            });
            $(this.cancelInput).on("click", function () {
                _this._cancel();
            });
            $(this.saveInput).on("click", function () {
                var img = null;
                if (_this.options.doImage == "open") {
                    var image = _this.canvas.toDataURL("image/png");
                    img = new Image();
                    img.src = image;
                    var w = window.open('about:blank', 'image from canvas');
                    w.document.write("<img src='" + image + "' width='" + _this.options.width
                        + "' height='" + _this.options.height + "' alt='from canvas'/>");
                } else if (_this.options.doImage.length > 0) {
                    img = Canvas2Image.convertToImage(_this.canvas, _this.options.photoW, _this.options.photoH, "png")
                    _this.options.doImage[0].appendChild(img);
                    $(_this.result).html("保存成功").show();
                    var x = setTimeout(function () {
                        $(_this.result).hide();
                        clearTimeout(x);
                    }, 1000)
                } else {
                    _this.uploadPhoto();
                }
                _this.options.onEnd && _this.options.onEnd(img);
                _this._cancel();
            });
        },
        _cancel: function () {
            this.canvas.style.display = "none";
            this.takeInput.style.display = "inline-block";
            this.saveInput.style.display = "none";
            this.cancelInput.style.display = "none";
        },
        stop: function () {
            this.video.pause();
        },
        _errBack: function (error) {
            console.log("Video capture error: ", error.code);
        },
        takePhote: function () {
            var context = this.canvas.getContext('2d');
            context.fillStyle = "#ffffff";
            context.fillRect(0, 0, this.width, this.height);
            context.drawImage(this.video, 0, 0, this.width, this.height, 0, 0, this.width, this.height);
            this.canvas.style.display = "block";
            this.takeInput.style.display = "none";
            this.saveInput.style.display = "inline-block";
            this.cancelInput.style.display = "inline-block";
        },
        photeBase64: function () {
            var imgData = this.canvas.toDataURL();
            return imgData.substr(22);
        },
        uploadPhoto: function () {
            var request = this.createRequest();
            if (request == null) {
                alert("Unable to create request");
            }
            else {
                var base64Data = this.photeBase64();
                var url = this.options.doImage;
                request.open("POST", url, true);
                request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                request.onreadystatechange = this.responses;
                request.send("&img=" + base64Data);
            }
        },
        responses: function (request) {
            if (request.readyState == 4)//服务器处理结束
            {
                if (request.status == 200)//一切正常
                {
                    if (request.responseText == "OK") {
                        alert("上传成功！");
                    }
                    else {
                        alert("上传失败！");
                        alert(request.responseText);
                    }
                }
            }
        },
        createRequest: function () {
            var request;
            try {
                request = new XMLHttpRequest();//For火狐，谷歌等浏览器
            } catch (tryMS) {
                try {
                    request = new ActiveXObject("Msxm12.XMLHTTP");//For使用微软Msxm12.XMLHTTP库的浏览器
                } catch (otherMS) {
                    try {
                        request = new ActiveXObject("Microsoft.XMLHTTP");//For使用微软Microsoft.XMLHTTP库的浏览器
                    } catch (failed) {
                        request = null;
                    }
                }
            }
            return request;
        }
    };
    var Canvas2Image = function () {
        var $support = function () {
            var canvas = document.createElement('canvas'),
                ctx = canvas.getContext('2d');
            return {
                canvas: !!ctx,
                imageData: !!ctx.getImageData,
                dataURL: !!canvas.toDataURL,
                btoa: !!window.btoa
            };
        }();
        var downloadMime = 'image/octet-stream';

        function scaleCanvas(canvas, width, height) {
            var w = canvas.width,
                h = canvas.height;
            if (width == undefined) {
                width = w;
            }
            if (height == undefined) {
                height = h;
            }
            var retCanvas = document.createElement('canvas');
            var retCtx = retCanvas.getContext('2d');
            retCanvas.width = width;
            retCanvas.height = height;
            retCtx.drawImage(canvas, 0, 0, w, h, 0, 0, width, height);
            return retCanvas;
        }

        function getDataURL(canvas, type, width, height) {
            canvas = scaleCanvas(canvas, width, height);
            return canvas.toDataURL(type);
        }

        function saveFile(strData) {
            document.location.href = strData;
        }

        function genImage(strData) {
            var img = document.createElement('img');
            img.src = strData;
            return img;
        }

        function fixType(type) {
            type = type.toLowerCase().replace(/jpg/i, 'jpeg');
            var r = type.match(/png|jpeg|bmp|gif/)[0];
            return 'image/' + r;
        }

        function encodeData(data) {
            if (!window.btoa) {
                throw 'btoa undefined'
            }
            var str = '';
            if (typeof data == 'string') {
                str = data;
            } else {
                for (var i = 0; i < data.length; i++) {
                    str += String.fromCharCode(data[i]);
                }
            }
            return btoa(str);
        }

        function getImageData(canvas) {
            var w = canvas.width,
                h = canvas.height;
            return canvas.getContext('2d').getImageData(0, 0, w, h);
        }

        function makeURI(strData, type) {
            return 'data:' + type + ';base64,' + strData;
        }

        /**
         * create bitmap image
         */
        var genBitmapImage = function (data) {
            var imgHeader = [],
                imgInfoHeader = [];
            var width = data.width,
                height = data.height;
            imgHeader.push(0x42); // 66 -> B
            imgHeader.push(0x4d); // 77 -> M
            var fsize = width * height * 3 + 54; // header size:54 bytes
            imgHeader.push(fsize % 256); // r
            fsize = Math.floor(fsize / 256);
            imgHeader.push(fsize % 256); // g
            fsize = Math.floor(fsize / 256);
            imgHeader.push(fsize % 256); // b
            fsize = Math.floor(fsize / 256);
            imgHeader.push(fsize % 256); // a
            imgHeader.push(0);
            imgHeader.push(0);
            imgHeader.push(0);
            imgHeader.push(0);
            imgHeader.push(54); // offset -> 6
            imgHeader.push(0);
            imgHeader.push(0);
            imgHeader.push(0);
            // info header
            imgInfoHeader.push(40); // info header size
            imgInfoHeader.push(0);
            imgInfoHeader.push(0);
            imgInfoHeader.push(0);
            var _width = width;
            imgInfoHeader.push(_width % 256);
            _width = Math.floor(_width / 256);
            imgInfoHeader.push(_width % 256);
            _width = Math.floor(_width / 256);
            imgInfoHeader.push(_width % 256);
            _width = Math.floor(_width / 256);
            imgInfoHeader.push(_width % 256);
            var _height = height;
            imgInfoHeader.push(_height % 256);
            _height = Math.floor(_height / 256);
            imgInfoHeader.push(_height % 256);
            _height = Math.floor(_height / 256);
            imgInfoHeader.push(_height % 256);
            _height = Math.floor(_height / 256);
            imgInfoHeader.push(_height % 256);
            imgInfoHeader.push(1);
            imgInfoHeader.push(0);
            imgInfoHeader.push(24); // 24λbitmap
            imgInfoHeader.push(0);
            // no compression
            imgInfoHeader.push(0);
            imgInfoHeader.push(0);
            imgInfoHeader.push(0);
            imgInfoHeader.push(0);
            // pixel data
            var dataSize = width * height * 3;
            imgInfoHeader.push(dataSize % 256);
            dataSize = Math.floor(dataSize / 256);
            imgInfoHeader.push(dataSize % 256);
            dataSize = Math.floor(dataSize / 256);
            imgInfoHeader.push(dataSize % 256);
            dataSize = Math.floor(dataSize / 256);
            imgInfoHeader.push(dataSize % 256);
            // blank space
            for (var i = 0; i < 16; i++) {
                imgInfoHeader.push(0);
            }
            var padding = (4 - ((width * 3) % 4)) % 4;
            var imgData = data.data;
            var strPixelData = '';
            var y = height;
            do {
                var offsetY = width * (y - 1) * 4;
                var strPixelRow = '';
                for (var x = 0; x < width; x++) {
                    var offsetX = 4 * x;
                    strPixelRow += String.fromCharCode(imgData[offsetY + offsetX + 2]);
                    strPixelRow += String.fromCharCode(imgData[offsetY + offsetX + 1]);
                    strPixelRow += String.fromCharCode(imgData[offsetY + offsetX]);
                }
                for (var n = 0; n < padding; n++) {
                    strPixelRow += String.fromCharCode(0);
                }
                strPixelData += strPixelRow;
            } while (--y);
            return (encodeData(imgHeader.concat(imgInfoHeader)) + encodeData(strPixelData));
        };
        /**
         * saveAsImage
         * @param canvasElement
         * @param {String} image type
         * @param {Number} [optional] png width
         * @param {Number} [optional] png height
         */
        var saveAsImage = function (canvas, width, height, type) {
            if ($support.canvas && $support.dataURL) {
                if (type == undefined) {
                    type = 'png';
                }
                type = fixType(type);
                if (/bmp/.test(type)) {
                    var data = getImageData(scaleCanvas(canvas, width, height));
                    var strData = genBitmapImage(data);
                    saveFile(makeURI(strData, downloadMime));
                } else {
                    var strData = getDataURL(canvas, type, width, height);
                    saveFile(strData.replace(type, downloadMime));
                }
            }
        };
        var convertToImage = function (canvas, width, height, type) {
            if ($support.canvas && $support.dataURL) {
                if (type == undefined) {
                    type = 'png';
                }
                type = fixType(type);
                if (/bmp/.test(type)) {
                    var data = getImageData(scaleCanvas(canvas, width, height));
                    var strData = genBitmapImage(data);
                    return genImage(makeURI(strData, 'image/bmp'));
                } else {
                    var strData = getDataURL(canvas, type, width, height);
                    return genImage(strData);
                }
            }
        };
        return {
            saveAsImage: saveAsImage,
            saveAsPNG: function (canvas, width, height) {
                return saveAsImage(canvas, width, height, 'png');
            },
            saveAsJPEG: function (canvas, width, height) {
                return saveAsImage(canvas, width, height, 'jpeg');
            },
            saveAsGIF: function (canvas, width, height) {
                return saveAsImage(canvas, width, height, 'gif')
            },
            saveAsBMP: function (canvas, width, height) {
                return saveAsImage(canvas, width, height, 'bmp');
            },
            convertToImage: convertToImage,
            convertToPNG: function (canvas, width, height) {
                return convertToImage(canvas, width, height, 'png');
            },
            convertToJPEG: function (canvas, width, height) {
                return convertToImage(canvas, width, height, 'jpeg');
            },
            convertToGIF: function (canvas, width, height) {
                return convertToImage(canvas, width, height, 'gif');
            },
            convertToBMP: function (canvas, width, height) {
                return convertToImage(canvas, width, height, 'bmp');
            }
        };
    }();
})(jQuery);