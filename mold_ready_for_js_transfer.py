import random
import pygame
import numpy as np
import time
import math
from PIL import Image
import matplotlib.pyplot as plt

START_POINT = [[300, 300]]
QUALITY = 'LOW'

if QUALITY == 'LOW':
    TRAIL = True
    LENGH = 5
else:
    TRAIL = False
    LENGH = 20

SENSORS = False
FOOD_EAT = 40
FOOD = True
SIZE = (600, 600)
CL = (33, 33, 33)
ANGLE = 360
K = 0
SAVE = False


class Modeling():
    def __init__(self, trsCount = 1):
        self.trsCount = trsCount
        for item in START_POINT:
            self.arrOrganism = [Particle(item[0], item[1]) for i in range(trsCount)]

    def drawOutput(self, screen):
        for elem in self.arrOrganism:
            for chek in START_POINT:
                dx = math.fabs(elem.x - chek[0])
                dy = math.fabs(elem.y - chek[1])
                if math.sqrt(dx*dx + dy*dy) <= 5:
                    elem.food = 255

            # Draw particle
            if QUALITY == 'LOW':
                pygame.draw.circle(screen, (0 + elem.food, int(55 + elem.food/1.275), int(255 - elem.food/5.1)), (int(elem.x), int(elem.y)), 2, 1)
            elif QUALITY == 'HIGH':
                pygame.draw.circle(screen, (0 + elem.food, int(55 + elem.food/1.275), int(255 - elem.food/5.1)), (int(elem.x), int(elem.y)), 0, 0)

    def locationUpdate(self, Count):
        delete = []
        for a in range(len(self.arrOrganism)):
            #####
            elem = self.arrOrganism[a]
            elem.move()
            elem.share()
            ans = elem.sence()
            elem.rotate(ans)
            if elem.food >= 0:
                elem.food -= 0
            else:
                delete.append(a)
            #####
            # pygame.display.set_caption(f'{str(int(ans[0][1]))} - {str(int(ans[1][1]))} - {str(int(ans[2][1]))}')
            if elem.x >= 0 and elem.x <= SIZE[0] and elem.y >= 0 and elem.y <= SIZE[1]:
                TrailMap[int(elem.y), int(elem.x)] += 255
                if FoodMap[int(elem.y), int(elem.x)] <= 10:
                    FoodMap[int(elem.y), int(elem.x)] = 0
            else:
                delete.append(a)

        for ind in range(len(delete)):
            del model.arrOrganism[delete[ind]]
            Count -= 1
            for i in range(len(delete)):
                delete[i] -= 1
            
            # print('__deleted__')


class Particle():
    def __init__(self, x, y, heading = random.randint(0, 360)):
        """Constructor"""
        if QUALITY == 'LOW':
            self.SA = 45
            self.RA = 20
            self.SO = 9
            self.SS = 0.5
            self.depT = 5
            self.pCD = 0
            self.sMin = 0
            self.food = 255
            self.foodTrH = 20
            self.x = x
            self.y = y
            self.heading = heading

        elif QUALITY == 'HIGH':
            self.SA = 45
            self.RA = 20
            self.SO = 5
            self.SS = 0.5
            self.depT = 5
            self.pCD = 0 
            self.sMin = 0
            self.food = 255
            self.foodTrH = 20   
            self.x = x
            self.y = y
            self.heading = heading

    def childDetected(self):
        return self.food >= self.foodTrH

    def share(self):
        for elem in model.arrOrganism:
            if elem.x != self.x or elem.y != self.y:
                if self.food > elem.food:
                    dx = math.fabs(elem.x - self.x)
                    dy = math.fabs(elem.y - self.y)
                    if QUALITY == 'LOW': n = 3
                    elif QUALITY == 'HIGH': n = 6 
                    if math.sqrt(dx*dx + dy*dy) <= n:
                        if elem.food <= 255 - FOOD_EAT and self.food > FOOD_EAT:
                            elem.food += FOOD_EAT
                            self.food -= FOOD_EAT
    
    def test(self, y, x, var):
        var = [FoodMap[y, x], 20] [FoodMap[y, x] > 20]
        FoodMap[y, x] -= var # Transaction

    def move(self):
        var = [FoodMap[int(self.y), int(self.x)], 20] [FoodMap[int(self.y), int(self.x)] > 20]
        if self.food <= 255 - 20:
            self.food += var # Transaction
        self.test(int(self.y), int(self.x), var)
        self.test(int(self.y+1), int(self.x), var)
        self.test(int(self.y-1), int(self.x), var)
        self.test(int(self.y), int(self.x+1), var)
        self.test(int(self.y), int(self.x-1), var)
        dx = math.sin(math.radians(self.heading)) * (self.SS + FoodMap[int(self.y), int(self.x)]/255 * K)
        dy = math.cos(math.radians(self.heading)) * (self.SS + FoodMap[int(self.y), int(self.x)]/255 * K)
        if Skip == False and FoodMap[int(self.y + dy), int(self.x + dx)] >= 0:
            self.x += dx
            self.y += dy
    
    def rotate(self, ans):
        if ans[0][1] > 0 or ans[2][1] > 0:
            if ans[0][1] > ans[2][1]:
                # turn left
                self.heading += 5
            else:
                # turn right
                self.heading -= 5

        rand = random.randint(0, 15)
        if rand == 1:
            # turn randomly
            r = random.randint(0, 1)
            if r == 0:
                self.heading += self.RA
            else:
                self.heading -= self.RA
        else:
            if ans[1][0] >= ans[0][0] and ans[1][0] >= ans[2][0]:
                pass
            elif ans[1][0] < ans[0][0] and ans[1][0] < ans[2][0]:
                # turn randomly
                r = random.randint(0, 1)
                if r == 0:
                    self.heading += self.RA
                else:
                    self.heading -= self.RA
            elif ans[0][0] >= ans[1][0] and ans[0][0] >= ans[2][0]:
                # turn left
                self.heading += self.RA
            elif ans[2][0] >= ans[1][0] and ans[2][0] >= ans[0][0]:
                # turn right
                self.heading -= self.RA


    def sence(self):
        """LEFT"""
        dx1 = int(math.sin(math.radians(self.heading + self.SA)) * self.SO)
        dy1 = int(math.cos(math.radians(self.heading + self.SA)) * self.SO)
        if SENSORS:
            pygame.draw.circle(screen, (0, 0, 0), (int(self.x + dx1), int(self.y + dy1)), 0, 0)
        """SENTER"""
        dx2 = int(math.sin(math.radians(self.heading)) * self.SO)
        dy2 = int(math.cos(math.radians(self.heading)) * self.SO)
        if SENSORS:
            pygame.draw.circle(screen, (0, 0, 0), (int(self.x + dx2), int(self.y + dy2)), 0, 0)
        """RIGHT"""
        dx3 = int(math.sin(math.radians(self.heading - self.SA)) * self.SO)
        dy3 = int(math.cos(math.radians(self.heading - self.SA)) * self.SO)
        if SENSORS:
           pygame.draw.circle(screen, (0, 0, 0), (int(self.x + dx3), int(self.y + dy3)), 0, 0)
        try:
            element0 = [TrailMap[int(self.y + dy1), int(self.x + dx1)], FoodMap[int(self.y + dy1), int(self.x + dx1)]]
            element1 = [TrailMap[int(self.y + dy2), int(self.x + dx2)], FoodMap[int(self.y + dy2), int(self.x + dx2)]]
            element2 = [TrailMap[int(self.y + dy3), int(self.x + dx3)], FoodMap[int(self.y + dy3), int(self.x + dx3)]]
            return [element0, element1, element2]
        except:
            return [0, 0, 0]



if __name__ == "__main__":
    N = 0
    pygame.init()
    screen = pygame.display.set_mode(SIZE)
    screen.fill(CL)
    pygame.display.update()
    Skip = False

    clock = pygame.time.Clock()
    TrailMap = np.zeros((SIZE[1], SIZE[0]))
    FoodMap = np.zeros((SIZE[1], SIZE[0]))
    model = Modeling(1)
    Count = 1

    def makeCircle(p, type, s = 20):
        for i in range(s):
            for angl in range(360):
                dx = math.sin(math.radians(angl)) * i
                dy = math.cos(math.radians(angl)) * i
                if type == 'FOOD':
                    FoodMap[int(p[1] + dy), int(p[0] + dx)] = 255 - (i * 255/s)
                else:
                    FoodMap[int(p[1] + dy), int(p[0] + dx)] = 255 - (9-1 * i * 255/s)


    done = False
    while not done:
        for i in pygame.event.get():
            if i.type == pygame.QUIT:
                done = True
            elif i.type == pygame.MOUSEBUTTONDOWN:
                if i.button == 1:
                    makeCircle(pygame.mouse.get_pos(), 'FOOD')
                else:
                    makeCircle(pygame.mouse.get_pos(), 'WASTE')

            elif i.type == pygame.KEYDOWN:
                if Skip == False:
                    Skip = True
                else:
                    Skip = False

        for y in range(TrailMap.shape[0]):
            for x in range(TrailMap.shape[1]):
                if FoodMap[y, x] > 0:
                    value = FoodMap[y, x]
                    pygame.draw.circle(screen, (CL[0], CL[0] + (value / 255) * 222, CL[0]), (x, y), 1, 0)
                elif FoodMap[y, x] < 0:
                    value = math.fabs(FoodMap[y, x])
                    # pygame.draw.circle(screen, (255 - value, 255 - value, 255 - value), (x, y), 1, 0)

                if TrailMap[y, x] >= 8:
                    TrailMap[y, x] -= 8
                    if TRAIL:
                        value = TrailMap[y, x]
                        if value > 255:
                            value = 255
                        pygame.draw.circle(screen, (255 - value, 255 - value, 255 - value), (x, y), 0, 0)


        model.locationUpdate(Count)
        model.drawOutput(screen)
        for elem in START_POINT:
            pygame.draw.circle(screen, (200, 0, 0), (elem[0], elem[1]), 6, 3) # Start Point


        for i in range(LENGH):
            for point in START_POINT:
                if not Skip:
                    model.arrOrganism.append(Particle(x=point[0], y=point[1], heading=random.randint(0, ANGLE)))
                    Count += 1

        pygame.display.set_caption(str(Count) + ' Particles')
        
        if SAVE:
            pygame.image.save(screen, 'screens/file-' + str(N) + '.png')

        N += 1   
        pygame.display.update()
        screen.fill(CL)

    print(f'--{Count}--')
    pygame.quit()
