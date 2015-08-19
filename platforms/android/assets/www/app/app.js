(function (document, angular) {
    var _app = angular.module('lolphotobooth', ['ngRoute', 'ngTouch', 'ngAnimate']);

    _app.config(function ($routeProvider) {
        $routeProvider.when('/', {
            templateUrl: 'app/views/home.html',
        }).when('/gallery', {
            templateUrl: 'app/views/gallery.html',
            controller: function ($scope) {
                $scope.imagesPath = [];
                if (window.localStorage.length > 0) {
                    var key = window.localStorage.key(0),
                        value = window.localStorage.getItem(key);
                    $scope.imagesPath = value.toString().split(',');
                }

                $scope.shareIt = function (imageUrl) {
                    window.plugins.socialsharing.share(null, null, 'file:///' + imageUrl, null);
                }
            },
        }).when('/history', {
            templateUrl: 'app/views/history.html',
            controller: function ($scope) {

            }
        }).when('/about', {
            templateUrl: 'app/views/about.html',
        }).when('/test', {
            templateUrl: 'app/views/test.html',
            controller: function ($scope) {
                var element, targetSize, animationEvt, size = 0, opacity = 0, opacityStep = 0, requestAnimationFrame = window.requestAnimationFrame, cancelAnimationFrame = window.cancelAnimationFrame;
                function startAnimation() {
                    size++;
                    opacityStep += 1;
                    opacity = opacityStep / 100;
                    element.style.webkitTransform = 'scale(' + size / 100 + ')';
                    element.style.opacity = opacity;
                    animationEvt = requestAnimationFrame(startAnimation);
                    if (size >= 100) {
                        stopAnimation();
                    }
                }

                function stopAnimation() {
                    cancelAnimationFrame(animationEvt);
                }

                $scope.start = function (elemId) {
                    element = document.getElementById(elemId);
                    targetSize = { height: (window.outerHeight * 90) / 100, width: (window.outerWidth * 90) / 100 };

                    element.style.webkitTransform = 'scale(0,0)';
                    element.style.opacity = opacity;
                    element.style.display = 'block';

                    requestAnimationFrame(startAnimation);
                }

                $scope.stop = function () {
                    stopAnimation();
                }

            }
        }).otherwise({
            redirectTo: '/'
        });
    });

    _app.run(function ($rootScope, $route) {
        $rootScope.$on('$routeChangeSuccess', function (event, current, prev) {
            $rootScope.activeRoute = $route.current.originalPath;
        });
    });

    _app.controller('appController', function ($scope, $http, $location, $interval) {
        $scope.folderName = '';
        $scope.remoteFiles = [];
        $scope.totalImages = 0;
        $scope.isProcessing = false;
        $scope.isCompleted = false;
        $scope.progress = 0;
        $scope.step = 0;
        $scope.savedImages = [];

        $scope.startScan = function () {
            cordova.plugins.barcodeScanner.scan(function (result) {
                if (result.text !== "") {
                    if (checkConnection() === Connection.NONE) {
                        alert('You are not connected to internet. Please set up your internet connection properly.');
                        return;
                    }
                    if (result.text.match('lolphotobooth.co').length < 1) {
                        alert('Sorry, seems like your QRCode is invalid. Please use a valid qr code.');
                        return;
                    }
                    $scope.$apply(function (scope) {
                        scope.sourceUrl = result.text;
                        scope.emulateProgress();
                    });
                }
            }, function (error) {
                alert("Scanning failed: " + error);
            });
        }

        $scope.downloadJson = function (sessionUrl) {
            sessionUrl = sessionUrl + '?isAppRequest=true';
            $http.get(sessionUrl).then(function (response) {
                var project = response.data;
                if (!project.ProjectName) {
                    alert('Sorry, seems like your QRCode is invalid. Please use a valid qr code.');
                    if (angular.isDefined($scope.progressLooper)) {
                        $interval.cancel($scope.progressLooper);
                        $scope.isProcessing = false;
                        $scope.isCompleted = false;
                        $scope.progress = 0;
                        $scope.step = 0;
                    }
                    return;
                }

                $scope.folderName = project.ProjectName;
                if (!project.IsActive) {
                    return;
                }

                var totalImages = project.Images.length;
                for (var i = 0; i < totalImages; i++) {
                    var image = project.Images[i];
                    $scope.remoteFiles.push('http://' + image.Url);
                }
                $scope.savedImages = [];
                window.localStorage.clear();
                if (totalImages > 0) {
                    $scope.totalImages = totalImages;
                    $scope.downloadImage();
                }
            }, function () {
                alert('Sorry, seems like your QRCode is invalid. Please contact your event organizer for further informaation.');
            });
        }

        $scope.downloadImage = function () {
            if ($scope.remoteFiles.length == 0) {
                $scope.step = 0;
                var key = new Date().getTime().toString();
                window.localStorage.setItem(key, $scope.savedImages);
                $scope.isCompleted = true;
                $scope.progress = 100;
                console.log($scope.progress, $scope.isCompleted, "____")
                return;
            }
            var imageUrl = $scope.remoteFiles.pop();
            createCanvas(imageUrl);
        }

        function createCanvas(imageUrl) {
            var id = imageUrl.substring(imageUrl.lastIndexOf('/') + 1),
                canvas = document.createElement('canvas');
            canvas.setAttribute('id', id);
            var context = canvas.getContext('2d'),
                image = new Image();

            image.onload = function () {
                canvas.width = this.width;
                canvas.height = this.height;
                context.drawImage(image, 0, 0);
                $scope.$apply(function () {
                    $scope.saveImage(canvas);
                });
            };
            image.src = imageUrl;
        }

        $scope.saveImage = function (canvasElement) {
            window.canvas2ImagePlugin.saveImageDataToLibrary(function (fileLocation) {
                $scope.$apply(function (scope) {
                    scope.savedImages.push(fileLocation);
                    scope.step++;
                    //scope.progress = ((100 / scope.totalImages) * scope.step);
                    scope.downloadImage();
                });
            }, function (err) {
                console.log(err);
            }, canvasElement);
        }

        $scope.onShow = function () {
            $scope.downloadJson($scope.sourceUrl);
        }

        $scope.onClose = function () {
            $scope.progress = 0;
            $scope.isProcessing = false;
            if ($scope.isCompleted) {
                $location.path('/gallery');
            }
            else {
                $location.path('/');
            }
        }

        $scope.progressLooper;
        $scope.emulateProgress = function () {
            $scope.isProcessing = !$scope.isProcessing;
            if ($scope.isProcessing == true) {
                $scope.progressLooper = $interval(function () {
                    $scope.progress++;
                    if ($scope.progress >= 80) {
                        $interval.cancel($scope.progressLooper);
                    }
                }, 50);
            }
            else {
                $interval.cancel($scope.progressLooper);
            }
        }

        function checkConnection() {
            return navigator.connection.type;
        }
    });

    _app.directive('modalProgressBar', function ($parse) {
        return {
            restrict: 'E',
            replace: true,
            templateUrl: 'app/partials/dlg_progress_tmpl.html',
            scope: {
                show: '=',
                progress: '=',
                closeOnComplete: '=',
                onClose: '&',
                onShow: '&',
            },
            link: function (scope, elem, attrs) {
                var $element = $(elem);

                scope.$watch('progress', function (a, o) {
                    if (a >= 100) {
                        if (scope.closeOnComplete) {
                            scope.showModal(false, $element);
                        }
                    }
                });

                $element.modal({ backdrop: 'static', show: false });

                scope.showModal = function (visible, elem) {
                    if (!elem) elem = $element;
                    if (visible)
                        elem.modal('show');
                    else
                        elem.modal("hide");
                }

                scope.$watch('show', function (newValue, oldValue) {
                    scope.showModal(newValue, $element);
                });

                $element.on('shown.bs.modal', function (e) {
                    scope.$apply(function (scope) {
                        scope.onShow();
                    });
                });

                $element.on('hidden.bs.modal', function (e) {
                    scope.$apply(function (scope) {
                        scope.onClose();
                    });
                });
            }
        }
    });
})(document, angular)