import numpy as np
from PIL import Image, ImageSequence
from matplotlib import pyplot as plt

im = Image.open("/Users/artifex/Desktop/mc.tif")

imgs = []
for i, page in enumerate(ImageSequence.Iterator(im)):
    imgs += [np.array(page)]

plt.imshow(imgs[3],'gray')
k =0