import json
import os
from argparse import ArgumentParser


ap = ArgumentParser()
ap.add_argument('-i', '--input', required=True, help='Path to the file to convert')
ap.add_argument('-l', '--limit', required=False, help='Limit number of frames outputed', default=-1)
args = vars(ap.parse_args())


with open(os.path.join('lib/saves/', args['input'])) as f:
    frames = json.load(f)

    for i in range(2, len(frames)):
        for dimension in ['x', 'y', 'z']:
            particles = []
            for particle, elem in enumerate(frames[i][dimension]):
                particles.append(round(elem, 3))

            frames[i][dimension] = particles


    with open(os.path.join('lib/saves/', 'converted_' + args['input']), 'w') as output:
        limit = [int(args['limit']), len(frames)][args['limit'] == -1]
        print(limit)
        output.write(json.dumps(frames[:limit]))

