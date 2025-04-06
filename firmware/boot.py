# This file is executed on every boot (including wake-boot from deepsleep)
import gc
import webrepl

# Enable garbage collection
gc.collect()

# Uncomment the line below to start WebREPL
# webrepl.start()