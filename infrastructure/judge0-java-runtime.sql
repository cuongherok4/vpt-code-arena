UPDATE languages
SET run_cmd = '/usr/local/openjdk13/bin/java -Xmx256m -XX:MaxMetaspaceSize=256m -XX:+UseSerialGC -XX:ActiveProcessorCount=1 Main'
WHERE id = 62;
