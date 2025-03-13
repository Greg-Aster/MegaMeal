Features of site, sitemap, how to make it work:

Notes - 

-email forwarding service is formspree
-in developer mode all drafts are set to false - this code is in the the url-utils.ts file
-Profile avatar image was orignally set in config.ts but is now set in Profile.astro.
-code for banner is set in MainGridLayout.astro (needs fixing still also)
-"dark Pages" are drafts with links
- Swup hooks aka the interactive parts are currently only the toc,  the banner, theblog posts, and fullwidthbanner (inactive)

Development and known bugs -

2-20-2025 about.astro has had a full revamp and some of the page info is still in development
2-20-2025 New community tab
*fixed* 2-25there is a bug with container length not loading if the page is resized afer page load 
*fixed* 2-26more bugs found with container opening in mobile version - particularly when you open the container if your in the wrong place in the place it flys up and you find yourself on the bottom of the page

*fixed*2-27 thumbnail images dont look righ on mobile
*fixed*2-27-backgroud doesnt look good on mobile either
*fixed - mdx file solution*3-1 toc widget does not work with html elements
*fixed*3-2 numerous flow bug with toc widget
* managed but not fixed* Memory usage rampant horror show
