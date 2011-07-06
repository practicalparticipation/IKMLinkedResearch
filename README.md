data.younglives.org.uk
======================

This project uses phing as a build tool

NB: Currently this build defaults to configuring mysql based Ontowiki and it assumes you've already got a database as per the conf/config.ini.younglives-mysql  file. An alternative virtuoso based config is available

Make sure you've got Phing:

    $> pear channel-discover pear.phing.info
    $> pear install phing/phing
    
Run the dev-build target from the build.xml

    $> phing dev-build

    
