//
//  Canvas2ImagePlugin.m
//  Canvas2ImagePlugin PhoneGap/Cordova plugin
//
//  Created by Tommy-Carlos Williams on 29/03/12.
//  Copyright (c) 2012 Tommy-Carlos Williams. All rights reserved.
//  MIT Licensed
//
//  99% of this code developed by tommy-carlos williams and ThalesValentim

#import "Canvas2ImagePlugin.h"
#import <Cordova/CDV.h>
#import <Foundation/Foundation.h>


@implementation Canvas2ImagePlugin
@synthesize latestCommand;


-(void) saveImage:(UIImage *)image withFileName:(NSString *)imageName ofType:(NSString *)extension inDirectory:(NSString *)directoryPath and: (CGFloat) quality {
    
    if ( ([[extension lowercaseString] isEqualToString:@"png"]) || ([[extension lowercaseString] isEqualToString:@".png"]) ){
        [UIImagePNGRepresentation(image) writeToFile:[directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.%@", imageName, @"png"]] options:NSAtomicWrite error:nil];
    } else if ([[extension lowercaseString] isEqualToString:@".jpg"] || [[extension lowercaseString] isEqualToString:@".jpeg"]
               || [[extension lowercaseString] isEqualToString:@"jpg"] || [[extension lowercaseString] isEqualToString:@"jpeg"]) {
        [UIImageJPEGRepresentation(image, quality) writeToFile:[directoryPath stringByAppendingPathComponent:[NSString stringWithFormat:@"%@.%@", imageName, @"jpg"]] options:NSAtomicWrite error:nil];
    } else {
        ALog(@"Image Save Failed\nExtension: (%@) is not recognized, use (PNG/JPG)", extension);
    }
}


- (void)saveImageDataToLibrary:(CDVInvokedUrlCommand*)command
{
    NSDate *date = [NSDate date];
    NSDateFormatter *dateFormatter = [[NSDateFormatter alloc]init];
    [dateFormatter setDateFormat:@"yyyyMMddHHmmss"];
    NSString *dateString = [dateFormatter stringFromDate:date];

    self.latestCommand = command;
    NSData* imageData = [NSData dataFromBase64String:[command.arguments objectAtIndex:0]];
    
    UIImage* image = [[[UIImage alloc] initWithData:imageData] autorelease];

    NSString * path = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) objectAtIndex:0];
    NSString *temp = @"ImageFile-";
    NSString *ImageName = [temp stringByAppendingFormat:@"%@",dateString];
    NSString *extension = @"png";
    extension = [command.arguments objectAtIndex:1];
    CGFloat quality = 1.0;
    quality = [[command.arguments objectAtIndex:2] floatValue] / 100;
    
    
    [self saveImage:image withFileName:ImageName ofType:extension inDirectory:path and:quality];
    
    NSString *tileDirectory = [[NSBundle mainBundle] resourcePath];
    NSString *documentFolderPath = [NSSearchPathForDirectoriesInDomains(NSDocumentDirectory, NSUserDomainMask, YES) lastObject];
    NSLog(@"Tile Directory: %@", tileDirectory);
    NSLog(@"Doc Directory: %@", documentFolderPath);
    UIImageWriteToSavedPhotosAlbum(image, self, @selector(image:didFinishSavingWithError:contextInfo:), nil);
    CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK messageAsString:[NSString stringWithFormat:@"%@/%@%@", documentFolderPath, ImageName, extension]];
    [self.commandDelegate sendPluginResult:result callbackId:command.callbackId];
}

- (void)image:(UIImage *)image didFinishSavingWithError:(NSError *)error contextInfo:(void *)contextInfo
{
    // Was there an error?
    if (error != NULL)
    {
        // Show error message...
        NSLog(@"ERROR: %@",error);
        CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_ERROR messageAsString:error.description];
        [self.commandDelegate sendPluginResult:result callbackId: self.latestCommand.callbackId];
    }
    else  // No errors
    {
        // Show message image successfully saved
        NSLog(@"IMAGE SAVED!");
        CDVPluginResult* result = [CDVPluginResult resultWithStatus: CDVCommandStatus_OK messageAsString:@"Image saved"];
        [self.commandDelegate sendPluginResult:result callbackId:self.latestCommand.callbackId];
    }
}

- (void)dealloc
{   
    [callbackId release];
    [super dealloc];
}


@end
