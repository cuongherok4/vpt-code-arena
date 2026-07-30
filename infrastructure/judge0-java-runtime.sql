UPDATE languages
SET run_cmd = '/usr/local/openjdk13/bin/java -Xms16m -Xmx192m -Xss256k -XX:MaxMetaspaceSize=96m -XX:CompressedClassSpaceSize=32m -XX:ReservedCodeCacheSize=32m -XX:+UseSerialGC -XX:ActiveProcessorCount=1 -XX:-UsePerfData Main'
WHERE id = 62;
