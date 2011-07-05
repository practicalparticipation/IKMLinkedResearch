data.younglives.org.uk
======================

This is an experiment in making a phing based build for the project

NB: Currently this build is for a mysql baced oOntowiki and it assumes you've already got a database as per the conf/config.ini.younglives  file

Make sure you've got Phing:

    $> pear channel-discover pear.phing.info
    $> pear install phing/phing
    
Run the dev-build target from the build.xml

    $> phing dev-build

    
