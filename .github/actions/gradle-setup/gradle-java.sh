#!/bin/bash
# Script to set up consistent Java environment for Gradle

# Display Java environment information
echo "Java environment configuration script"
echo "------------------------------------"
echo "JAVA_HOME: $JAVA_HOME"
echo "Java version:"
java -version

# Create or update gradle.properties to use the correct Java home
echo "Setting up gradle.properties with correct Java home..."
echo "org.gradle.java.home=$JAVA_HOME" > gradle.properties
echo "org.gradle.jvmargs=-XX:MaxMetaspaceSize=512m -Xmx1024m" >> gradle.properties
echo "org.gradle.daemon=true" >> gradle.properties

echo "gradle.properties created/updated successfully:"
cat gradle.properties

echo "------------------------------------"
