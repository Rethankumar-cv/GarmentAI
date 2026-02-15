try {
    npm run build | Out-File -FilePath build.log -Encoding UTF8
} catch {
    echo "Error"
}
