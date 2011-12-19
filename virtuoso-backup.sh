#!/usr/local/bin/bash

#kill all virtuoso processes for safety
/usr/bin/killall virtuoso-t

#create a tar.gz of /usr/local/virtuoso/ontowiki put it in
# /usr/local/backup/ontowiki-virtuoso.tar.gz and run this script from logrotate
/usr/bin/tar -zcf /usr/local/backup/ontowiki-virtuoso.tar.gz /usr/local/virtuoso/ontowiki

#restart the virtuoso process
/usr/local/bin/virtuoso-t -c /usr/local/virtuoso/ontowiki/virtuoso.ini


