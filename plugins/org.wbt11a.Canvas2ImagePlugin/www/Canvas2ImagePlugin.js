//
//  Canvas2ImagePlugin.js
//  Canvas2ImagePlugin PhoneGap/Cordova plugin
//
//  Created by Tommy-Carlos Williams on 29/03/12.
//  Copyright (c) 2012 Tommy-Carlos Williams. All rights reserved.
//  MIT Licensed
//

  module.exports = {
    
    saveImageDataToLibrary:function(successCallback, failureCallback, canvasId,fileExtension,quality,picfolder,add2galery) {
        // successCallback required
        if (typeof successCallback != "function") {
            console.log("Canvas2ImagePlugin Error: successCallback is not a function");
        }
        else if (typeof failureCallback != "function") {
            console.log("Canvas2ImagePlugin Error: failureCallback is not a function");
        }
        else if ((fileExtension) && ((fileExtension.toLowerCase() != '.jpg') && (fileExtension.toLowerCase != '.png'))) {
            console.log("Canvas2ImagePlugin Error: fileExtension must be '.jpg' or '.png'");
        }
        else {
            var canvas = (typeof canvasId === "string") ? document.getElementById(canvasId) : canvasId;
            var imageData = canvas.toDataURL().replace(/data:image\/png;base64,/,'');
            var extension='.png';
            var destQuality=100;
            if (fileExtension) extension=fileExtension.toLowerCase();
            try{
              if (quality) destQuality=parseFloat(quality);
            } catch (e){}
            var params= [imageData,extension,destQuality];
            if (picfolder) {
              params=[imageData,extension,destQuality,picfolder];
              if (add2galery) params.push(add2galery);
            }
            return cordova.exec(successCallback, failureCallback, "Canvas2ImagePlugin","saveImageDataToLibrary",params);
        }
    }
  };
  
